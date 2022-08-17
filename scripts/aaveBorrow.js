// deposit ETH collateral / borrow DAI / repay DAI
const { ethers, getNamedAccounts } = require('hardhat')
const { getWeth } = require('./getWeth')

async function main() {
    //convert ETH to WETH (erc20 standard needed)
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log(`lending pool address: ${lendingPool.address}`)

    // deposit
    const wethTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    // approve
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        'ILendingPoolAddressesProvider',
        '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress, account)
    return lendingPool
}

async function approveErc20(contractAddress, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt('')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
