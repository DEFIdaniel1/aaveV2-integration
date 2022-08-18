// deposit ETH collateral / borrow DAI / repay DAI
const { ethers, getNamedAccounts } = require('hardhat')
const { getWeth, tokenAmount } = require('./getWeth')
const daiContractAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'
const daiEthChainlinkAddress = '0x773616e4d11a78f511299002da57a0a94577f1f4'

async function main() {
    //convert ETH to WETH (erc20 standard needed)
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    const wethTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    // approve
    await approveErc20(wethTokenAddress, lendingPool.address, tokenAmount, deployer)
    await lendingPool.deposit(wethTokenAddress, tokenAmount, deployer, 0)
    console.log(`Deposited ${tokenAmount} WETH!`)

    // check borrow limit
    let { availableBorrowsETH, totalDebtETH } = await getUserAccountData(lendingPool, deployer)
    // convert available ETH borrow to DAI value
    const daiPrice = await getDAIPrice()
    const amountDAIToBorrow = +availableBorrowsETH * 0.95 * (1 / +daiPrice)
    const amountDAIToBorrowWei = ethers.utils.parseEther(amountDAIToBorrow.toString())

    //BORROW
    await borrowDAI(lendingPool, amountDAIToBorrowWei, deployer)
    //REPAY
    await repayDai(lendingPool, amountDAIToBorrowWei, deployer)
    //See remainder
    await getUserAccountData(lendingPool, deployer)
}

// get address for lendingPool protocol
async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        'ILendingPoolAddressesProvider',
        '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress, account)
    console.log('Lending Pool account received.')
    return lendingPool
}

// need to grant Aave contract approval to access tokens
async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt('IERC20', erc20Address, account)
    // APPROVE function requirements
    //     function approve(address spender, uint256 value) external returns (bool success);
    const approveErc20Tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await approveErc20Tx.wait(1)
    console.log(`Approved ${spenderAddress} to spend ${amountToSpend} tokens.`)
}

async function getUserAccountData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH,
        currentLiquidationThreshold,
        ltv,
        healthFactor,
    } = await lendingPool.getUserAccountData(account)
    console.log('------------USER INFO-------------------')
    console.log('Total collateral ETH = ' + totalCollateralETH)
    console.log('Total Debt ETH = ' + totalDebtETH)
    console.log('Available Borrows in ETH = ' + availableBorrowsETH)
    console.log('Liquidation threashold = ' + currentLiquidationThreshold)
    console.log('Your LTV = ' + ltv)
    console.log('Health Factor Score = ' + healthFactor)
    console.log('-------------------------------')
    return { totalDebtETH, availableBorrowsETH }
}

// get DAI price from chainlink oracle
async function getDAIPrice() {
    const daiETHPriceFeed = await ethers.getContractAt(
        'AggregatorV3Interface',
        daiEthChainlinkAddress
    )
    //function latestRoundData()
    //  returns (
    //      uint80 roundId,
    //      int256 answer, <------ Price, this is what we want
    //      uint256 startedAt,
    //      uint256 updatedAt,
    //      uint80 answeredInRound
    const price = (await daiETHPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is: ${price.toString()}`)
    return price
}

async function borrowDAI(lendingPool, amountDAIToBorrowWei, deployer) {
    const borrowTx = await lendingPool.borrow(
        daiContractAddress,
        amountDAIToBorrowWei,
        2,
        0,
        deployer
    )
    await borrowTx.wait(1)
    console.log('---------------BORROW----------------')
    console.log(`You borrowed ${amountDAIToBorrowWei} DAI (in wei).`)
}

async function repayDai(lendingPool, amount, account) {
    //approve sending DAI back to contract
    await approveErc20(daiContractAddress, lendingPool.address, amount, account)
    // function repay(
    //     address asset,
    //     uint256 amount,
    //     uint256 rateMode,
    //     address onBehalfOf
    const repayTx = await lendingPool.repay(daiContractAddress, amount, 2, account)
    await repayTx.wait(1)
    console.log('Debt repaid!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
