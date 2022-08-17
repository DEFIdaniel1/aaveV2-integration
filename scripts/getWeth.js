// convert ETH to WETH
// need ABI/contract address
const { getNamedAccounts, ethers } = require('hardhat')

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const amount = ethers.utils.parseEther('0.03')
    //call deposit on weth contract
    //interface is an alternative to ABI since all ERC20s have the same starting functions
    const iWeth = await ethers.getContractAt(
        'IWeth',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //mainnet addresss
        deployer
    )
    const depositTx = await iWeth.deposit({ value: amount })
    await depositTx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log('Received ' + wethBalance + ' WETH')
}

module.exports = { getWeth }
