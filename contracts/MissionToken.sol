// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * GLOBAL — MissionToken
 *
 * Self-contained launch token for the Robinhood/EVM theatre:
 * a minimal ERC20 plus a constant-product bonding curve with virtual
 * reserves (pump-style). The full supply is minted to the contract and
 * sold along the curve; ETH raised is held as the real reserve.
 *
 * Fees: `feeBps` is taken from the ETH side of every trade and split
 * between the creator and the platform at `creatorFeeShareBps`.
 *
 * Graduation: once the real ETH reserve reaches `graduationEth` the
 * token is flagged graduated. Curve trading stays open on testnet;
 * production migration to a DEX pool is intentionally out of scope.
 *
 * UNAUDITED — devnet/testnet use only.
 */
contract MissionToken {
    // ── ERC20 ──────────────────────────────────────────────
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ── Curve ──────────────────────────────────────────────
    uint256 public immutable k; // constant product (virtualEth * virtualTokens)
    uint256 public virtualEth; // virtual ETH reserve
    uint256 public virtualTokens; // virtual token reserve
    uint256 public realEth; // actual ETH held for the curve (fees excluded)
    uint256 public immutable graduationEth; // realEth needed to graduate
    bool public graduated;

    // ── Fees ───────────────────────────────────────────────
    uint16 public immutable feeBps; // trading fee on the ETH side
    uint16 public immutable creatorFeeShareBps; // creator's cut of the fee
    address public immutable creator;
    address public immutable platform;
    uint256 public totalCreatorFees;
    uint256 public totalPlatformFees;

    event Buy(address indexed buyer, uint256 ethIn, uint256 tokensOut, uint256 fee);
    event Sell(address indexed seller, uint256 tokensIn, uint256 ethOut, uint256 fee);
    event Graduated(uint256 realEth, uint256 timestamp);

    uint256 private locked = 1;
    modifier nonReentrant() {
        require(locked == 1, "REENTRANT");
        locked = 2;
        _;
        locked = 1;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply, // 18-decimals
        uint16 _feeBps, // 25..1000
        uint16 _creatorFeeShareBps, // 0..10000
        address _creator,
        address _platform,
        uint256 _virtualEth, // initial virtual ETH reserve == initial mcap in wei
        uint256 _graduationEth // real ETH to collect before graduation
    ) {
        require(_totalSupply > 0, "SUPPLY");
        require(_feeBps >= 25 && _feeBps <= 1000, "FEE");
        require(_creatorFeeShareBps <= 10000, "SHARE");
        require(_virtualEth > 0 && _graduationEth > 0, "CURVE");

        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        feeBps = _feeBps;
        creatorFeeShareBps = _creatorFeeShareBps;
        creator = _creator;
        platform = _platform;

        virtualEth = _virtualEth;
        virtualTokens = _totalSupply;
        k = _virtualEth * _totalSupply;
        graduationEth = _graduationEth;

        // full supply starts in the curve
        balanceOf[address(this)] = _totalSupply;
        emit Transfer(address(0), address(this), _totalSupply);
    }

    // ── ERC20 ──────────────────────────────────────────────
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "ALLOWANCE");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "TO");
        require(balanceOf[from] >= value, "BALANCE");
        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    // ── Curve pricing (view) ───────────────────────────────
    function quoteBuy(uint256 ethIn) public view returns (uint256 tokensOut, uint256 fee) {
        fee = (ethIn * feeBps) / 10000;
        uint256 ethNet = ethIn - fee;
        uint256 newVirtualEth = virtualEth + ethNet;
        tokensOut = virtualTokens - (k / newVirtualEth);
    }

    function quoteSell(uint256 tokensIn) public view returns (uint256 ethOut, uint256 fee) {
        uint256 newVirtualTokens = virtualTokens + tokensIn;
        uint256 grossEth = virtualEth - (k / newVirtualTokens);
        fee = (grossEth * feeBps) / 10000;
        ethOut = grossEth - fee;
    }

    /** Spot price in wei per whole token (1e18 units). */
    function price() external view returns (uint256) {
        return (virtualEth * 1e18) / virtualTokens;
    }

    /** Market cap in wei. */
    function marketCap() external view returns (uint256) {
        return (virtualEth * totalSupply) / virtualTokens;
    }

    // ── Trading ────────────────────────────────────────────
    function buy(uint256 minTokensOut) external payable nonReentrant returns (uint256 tokensOut) {
        require(msg.value > 0, "ZERO");
        uint256 fee;
        (tokensOut, fee) = quoteBuy(msg.value);
        require(tokensOut >= minTokensOut, "SLIPPAGE");
        require(tokensOut <= balanceOf[address(this)], "SOLD_OUT");

        uint256 ethNet = msg.value - fee;
        virtualEth += ethNet;
        virtualTokens -= tokensOut;
        realEth += ethNet;

        _transfer(address(this), msg.sender, tokensOut);
        _payFees(fee);
        emit Buy(msg.sender, msg.value, tokensOut, fee);

        if (!graduated && realEth >= graduationEth) {
            graduated = true;
            emit Graduated(realEth, block.timestamp);
        }
    }

    function sell(uint256 tokensIn, uint256 minEthOut) external nonReentrant returns (uint256 ethOut) {
        require(tokensIn > 0, "ZERO");
        uint256 fee;
        (ethOut, fee) = quoteSell(tokensIn);
        require(ethOut >= minEthOut, "SLIPPAGE");
        require(ethOut + fee <= realEth, "RESERVE");

        virtualTokens += tokensIn;
        virtualEth -= (ethOut + fee);
        realEth -= (ethOut + fee);

        _transfer(msg.sender, address(this), tokensIn);
        _payFees(fee);
        (bool ok, ) = msg.sender.call{value: ethOut}("");
        require(ok, "SEND");
        emit Sell(msg.sender, tokensIn, ethOut, fee);
    }

    function _payFees(uint256 fee) internal {
        if (fee == 0) return;
        uint256 creatorCut = (fee * creatorFeeShareBps) / 10000;
        uint256 platformCut = fee - creatorCut;
        totalCreatorFees += creatorCut;
        totalPlatformFees += platformCut;
        if (creatorCut > 0) {
            (bool ok1, ) = creator.call{value: creatorCut}("");
            require(ok1, "CREATOR_FEE");
        }
        if (platformCut > 0) {
            (bool ok2, ) = platform.call{value: platformCut}("");
            require(ok2, "PLATFORM_FEE");
        }
    }

    /** One call for UIs: full curve + fee state. */
    function missionState()
        external
        view
        returns (
            uint256 _virtualEth,
            uint256 _virtualTokens,
            uint256 _realEth,
            uint256 _graduationEth,
            bool _graduated,
            uint256 _curveTokens,
            uint256 _totalCreatorFees,
            uint256 _totalPlatformFees
        )
    {
        return (
            virtualEth,
            virtualTokens,
            realEth,
            graduationEth,
            graduated,
            balanceOf[address(this)],
            totalCreatorFees,
            totalPlatformFees
        );
    }
}
