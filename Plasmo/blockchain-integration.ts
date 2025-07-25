// Blockchain Integration and Web3 Functionality for Plasmo Extensions

export interface BlockchainNetwork {
    id: string
    name: string
    chainId: number
    rpcUrl: string
    explorerUrl: string
    nativeCurrency: {
        name: string
        symbol: string
        decimals: number
    }
    testnet: boolean
}

export interface WalletConnection {
    address: string
    chainId: number
    provider: 'metamask' | 'walletconnect' | 'coinbase' | 'injected'
    balance: string
    connected: boolean
    permissions: string[]
}

export interface SmartContract {
    address: string
    abi: any[]
    name: string
    network: string
    verified: boolean
    functions: string[]
    events: string[]
}

export interface Transaction {
    hash: string
    from: string
    to: string
    value: string
    gasPrice: string
    gasLimit: string
    gasUsed?: string
    status: 'pending' | 'confirmed' | 'failed'
    blockNumber?: number
    timestamp: number
    data?: string
}

export interface NFTMetadata {
    tokenId: string
    contractAddress: string
    name: string
    description: string
    image: string
    attributes: Array<{
        trait_type: string
        value: string | number
    }>
    owner: string
    tokenURI: string
}

export interface DeFiPosition {
    protocol: string
    type: 'lending' | 'borrowing' | 'staking' | 'liquidity' | 'farming'
    token: string
    amount: string
    value: number
    apy: number
    rewards?: Array<{
        token: string
        amount: string
        value: number
    }>
}

class BlockchainManager {
    private static instance: BlockchainManager
    private provider: any = null
    private signer: any = null
    private connection: WalletConnection | null = null
    private contracts: Map<string, SmartContract> = new Map()
    private networks: Map<string, BlockchainNetwork> = new Map()
    private transactions: Map<string, Transaction> = new Map()
    private eventListeners: Map<string, Function[]> = new Map()

    static getInstance(): BlockchainManager {
        if (!BlockchainManager.instance) {
            BlockchainManager.instance = new BlockchainManager()
        }
        return BlockchainManager.instance
    }

    constructor() {
        this.initializeNetworks()
        this.setupEventListeners()
    }

    private initializeNetworks(): void {
        // Ethereum Mainnet
        this.networks.set('ethereum', {
            id: 'ethereum',
            name: 'Ethereum',
            chainId: 1,
            rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
            explorerUrl: 'https://etherscan.io',
            nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
            },
            testnet: false
        })

        // Polygon
        this.networks.set('polygon', {
            id: 'polygon',
            name: 'Polygon',
            chainId: 137,
            rpcUrl: 'https://polygon-rpc.com',
            explorerUrl: 'https://polygonscan.com',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            testnet: false
        })

        // Binance Smart Chain
        this.networks.set('bsc', {
            id: 'bsc',
            name: 'Binance Smart Chain',
            chainId: 56,
            rpcUrl: 'https://bsc-dataseed1.binance.org',
            explorerUrl: 'https://bscscan.com',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            testnet: false
        })

        // Arbitrum
        this.networks.set('arbitrum', {
            id: 'arbitrum',
            name: 'Arbitrum One',
            chainId: 42161,
            rpcUrl: 'https://arb1.arbitrum.io/rpc',
            explorerUrl: 'https://arbiscan.io',
            nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
            },
            testnet: false
        })

        // Optimism
        this.networks.set('optimism', {
            id: 'optimism',
            name: 'Optimism',
            chainId: 10,
            rpcUrl: 'https://mainnet.optimism.io',
            explorerUrl: 'https://optimistic.etherscan.io',
            nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
            },
            testnet: false
        })
    }

    private setupEventListeners(): void {
        // Listen for account changes
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length === 0) {
                    this.disconnect()
                } else {
                    this.handleAccountChange(accounts[0])
                }
            })

            window.ethereum.on('chainChanged', (chainId: string) => {
                this.handleChainChange(parseInt(chainId, 16))
            })

            window.ethereum.on('disconnect', () => {
                this.disconnect()
            })
        }
    }

    // Wallet Connection
    async connectWallet(provider: 'metamask' | 'walletconnect' | 'coinbase' = 'metamask'): Promise<WalletConnection> {
        try {
            let accounts: string[] = []
            let chainId: number = 1

            switch (provider) {
                case 'metamask':
                    if (!window.ethereum) {
                        throw new Error('MetaMask not installed')
                    }

                    accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    })

                    chainId = parseInt(await window.ethereum.request({
                        method: 'eth_chainId'
                    }), 16)

                    this.provider = window.ethereum
                    break

                case 'walletconnect':
                    // WalletConnect integration would go here
                    throw new Error('WalletConnect not implemented yet')

                case 'coinbase':
                    // Coinbase Wallet integration would go here
                    throw new Error('Coinbase Wallet not implemented yet')
            }

            if (accounts.length === 0) {
                throw new Error('No accounts found')
            }

            const balance = await this.getBalance(accounts[0])

            this.connection = {
                address: accounts[0],
                chainId,
                provider,
                balance,
                connected: true,
                permissions: ['eth_accounts']
            }

            this.emit('walletConnected', this.connection)
            console.log('🔗 Wallet connected:', this.connection)

            return this.connection
        } catch (error) {
            console.error('Failed to connect wallet:', error)
            throw error
        }
    }

    async disconnect(): Promise<void> {
        this.connection = null
        this.provider = null
        this.signer = null
        this.emit('walletDisconnected')
        console.log('🔌 Wallet disconnected')
    }

    private async handleAccountChange(newAccount: string): Promise<void> {
        if (this.connection) {
            this.connection.address = newAccount
            this.connection.balance = await this.getBalance(newAccount)
            this.emit('accountChanged', this.connection)
        }
    }

    private async handleChainChange(newChainId: number): Promise<void> {
        if (this.connection) {
            this.connection.chainId = newChainId
            this.emit('chainChanged', { chainId: newChainId })
        }
    }

    // Network Management
    async switchNetwork(networkId: string): Promise<void> {
        const network = this.networks.get(networkId)
        if (!network) {
            throw new Error('Network not found')
        }

        if (!this.provider) {
            throw new Error('No wallet connected')
        }

        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${network.chainId.toString(16)}` }]
            })
        } catch (error: any) {
            // If network doesn't exist, add it
            if (error.code === 4902) {
                await this.addNetwork(network)
            } else {
                throw error
            }
        }
    }

    async addNetwork(network: BlockchainNetwork): Promise<void> {
        if (!this.provider) {
            throw new Error('No wallet connected')
        }

        await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl],
                nativeCurrency: network.nativeCurrency
            }]
        })
    }

    // Balance and Token Operations
    async getBalance(address: string): Promise<string> {
        if (!this.provider) {
            throw new Error('No provider available')
        }

        try {
            const balance = await this.provider.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
            })

            // Convert from wei to ether
            return (parseInt(balance, 16) / Math.pow(10, 18)).toString()
        } catch (error) {
            console.error('Failed to get balance:', error)
            return '0'
        }
    }

    async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
        const contract = await this.getContract(tokenAddress, [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)'
        ])

        const balance = await contract.balanceOf(userAddress)
        const decimals = await contract.decimals()

        return (balance / Math.pow(10, decimals)).toString()
    }

    // Smart Contract Interaction
    async deployContract(
        bytecode: string,
        abi: any[],
        constructorArgs: any[] = []
    ): Promise<{ address: string; transactionHash: string }> {
        if (!this.signer) {
            throw new Error('No signer available')
        }

        // This would use ethers.js or web3.js for actual deployment
        // For now, we'll simulate deployment
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40)
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64)

        console.log('📄 Contract deployed:', { address: mockAddress, transactionHash: mockTxHash })

        return {
            address: mockAddress,
            transactionHash: mockTxHash
        }
    }

    async getContract(address: string, abi: any[]): Promise<any> {
        // This would return an ethers.js or web3.js contract instance
        // For now, we'll return a mock contract
        return {
            address,
            abi,
            // Mock contract methods
            balanceOf: async (owner: string) => Math.floor(Math.random() * 1000000),
            decimals: async () => 18,
            transfer: async (to: string, amount: string) => ({
                hash: '0x' + Math.random().toString(16).substr(2, 64)
            })
        }
    }

    async callContractMethod(
        contractAddress: string,
        abi: any[],
        methodName: string,
        args: any[] = [],
        options: { value?: string; gasLimit?: string } = {}
    ): Promise<any> {
        const contract = await this.getContract(contractAddress, abi)

        if (typeof contract[methodName] !== 'function') {
            throw new Error(`Method ${methodName} not found in contract`)
        }

        try {
            const result = await contract[methodName](...args, options)
            console.log(`📞 Contract method ${methodName} called:`, result)
            return result
        } catch (error) {
            console.error(`Failed to call contract method ${methodName}:`, error)
            throw error
        }
    }

    // Transaction Management
    async sendTransaction(
        to: string,
        value: string,
        data?: string,
        gasLimit?: string
    ): Promise<Transaction> {
        if (!this.connection) {
            throw new Error('No wallet connected')
        }

        const transaction: Transaction = {
            hash: '0x' + Math.random().toString(16).substr(2, 64),
            from: this.connection.address,
            to,
            value,
            gasPrice: '20000000000', // 20 gwei
            gasLimit: gasLimit || '21000',
            status: 'pending',
            timestamp: Date.now(),
            data
        }

        this.transactions.set(transaction.hash, transaction)

        // Simulate transaction confirmation
        setTimeout(() => {
            transaction.status = 'confirmed'
            transaction.blockNumber = Math.floor(Math.random() * 1000000) + 15000000
            transaction.gasUsed = '21000'
            this.emit('transactionConfirmed', transaction)
        }, 5000)

        this.emit('transactionSent', transaction)
        console.log('💸 Transaction sent:', transaction)

        return transaction
    }

    async getTransaction(hash: string): Promise<Transaction | null> {
        return this.transactions.get(hash) || null
    }

    async getTransactionReceipt(hash: string): Promise<any> {
        const transaction = this.transactions.get(hash)
        if (!transaction || transaction.status === 'pending') {
            return null
        }

        return {
            transactionHash: hash,
            blockNumber: transaction.blockNumber,
            gasUsed: transaction.gasUsed,
            status: transaction.status === 'confirmed' ? 1 : 0,
            logs: []
        }
    }

    // NFT Operations
    async getNFTs(address: string): Promise<NFTMetadata[]> {
        // This would integrate with services like Moralis, Alchemy, or OpenSea API
        // For now, we'll return mock NFT data
        const mockNFTs: NFTMetadata[] = [
            {
                tokenId: '1',
                contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
                name: 'Cool NFT #1',
                description: 'A very cool NFT',
                image: 'https://example.com/nft1.png',
                attributes: [
                    { trait_type: 'Background', value: 'Blue' },
                    { trait_type: 'Eyes', value: 'Laser' }
                ],
                owner: address,
                tokenURI: 'https://example.com/metadata/1'
            }
        ]

        return mockNFTs
    }

    async mintNFT(
        contractAddress: string,
        to: string,
        tokenURI: string
    ): Promise<{ tokenId: string; transactionHash: string }> {
        const tokenId = Math.floor(Math.random() * 10000).toString()
        const transactionHash = '0x' + Math.random().toString(16).substr(2, 64)

        console.log('🎨 NFT minted:', { tokenId, transactionHash })

        return { tokenId, transactionHash }
    }

    async transferNFT(
        contractAddress: string,
        from: string,
        to: string,
        tokenId: string
    ): Promise<string> {
        const transactionHash = '0x' + Math.random().toString(16).substr(2, 64)
        console.log('🔄 NFT transferred:', { from, to, tokenId, transactionHash })
        return transactionHash
    }

    // DeFi Operations
    async getDeFiPositions(address: string): Promise<DeFiPosition[]> {
        // This would integrate with DeFi protocols like Aave, Compound, Uniswap
        // For now, we'll return mock positions
        const mockPositions: DeFiPosition[] = [
            {
                protocol: 'Aave',
                type: 'lending',
                token: 'USDC',
                amount: '1000',
                value: 1000,
                apy: 3.5,
                rewards: [
                    { token: 'AAVE', amount: '0.1', value: 8.5 }
                ]
            },
            {
                protocol: 'Uniswap V3',
                type: 'liquidity',
                token: 'ETH/USDC',
                amount: '0.5',
                value: 1200,
                apy: 12.3
            }
        ]

        return mockPositions
    }

    async swapTokens(
        tokenIn: string,
        tokenOut: string,
        amountIn: string,
        minAmountOut: string,
        slippage: number = 0.5
    ): Promise<{ transactionHash: string; amountOut: string }> {
        // This would integrate with DEX aggregators like 1inch or direct DEX contracts
        const transactionHash = '0x' + Math.random().toString(16).substr(2, 64)
        const amountOut = (parseFloat(amountIn) * 0.99).toString() // Mock 1% slippage

        console.log('🔄 Token swap:', { tokenIn, tokenOut, amountIn, amountOut, transactionHash })

        return { transactionHash, amountOut }
    }

    async stakeLiquidity(
        poolAddress: string,
        token0Amount: string,
        token1Amount: string
    ): Promise<{ transactionHash: string; lpTokens: string }> {
        const transactionHash = '0x' + Math.random().toString(16).substr(2, 64)
        const lpTokens = Math.sqrt(parseFloat(token0Amount) * parseFloat(token1Amount)).toString()

        console.log('🏊 Liquidity staked:', { poolAddress, lpTokens, transactionHash })

        return { transactionHash, lpTokens }
    }

    // Price and Market Data
    async getTokenPrice(tokenAddress: string): Promise<{ price: number; change24h: number }> {
        // This would integrate with price APIs like CoinGecko or CoinMarketCap
        const mockPrice = Math.random() * 1000 + 1
        const mockChange = (Math.random() - 0.5) * 20

        return {
            price: mockPrice,
            change24h: mockChange
        }
    }

    async getGasPrice(): Promise<{ slow: string; standard: string; fast: string }> {
        // This would get real gas prices from the network
        return {
            slow: '10000000000', // 10 gwei
            standard: '20000000000', // 20 gwei
            fast: '30000000000' // 30 gwei
        }
    }

    // ENS (Ethereum Name Service)
    async resolveENS(name: string): Promise<string | null> {
        // This would resolve ENS names to addresses
        if (name.endsWith('.eth')) {
            return '0x' + Math.random().toString(16).substr(2, 40)
        }
        return null
    }

    async reverseResolveENS(address: string): Promise<string | null> {
        // This would reverse resolve addresses to ENS names
        if (Math.random() > 0.7) {
            return 'user' + Math.floor(Math.random() * 1000) + '.eth'
        }
        return null
    }

    // IPFS Integration
    async uploadToIPFS(data: Uint8Array | string): Promise<string> {
        // This would upload to IPFS via services like Pinata or Infura
        const mockHash = 'Qm' + Math.random().toString(36).substr(2, 44)
        console.log('📁 Uploaded to IPFS:', mockHash)
        return mockHash
    }

    async getFromIPFS(hash: string): Promise<any> {
        // This would retrieve data from IPFS
        console.log('📥 Retrieved from IPFS:', hash)
        return { message: 'Mock IPFS data' }
    }

    // Event System
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    private emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            listeners.forEach(callback => callback(data))
        }
    }

    // Utility Methods
    getConnection(): WalletConnection | null {
        return this.connection
    }

    getNetworks(): BlockchainNetwork[] {
        return Array.from(this.networks.values())
    }

    getCurrentNetwork(): BlockchainNetwork | null {
        if (!this.connection) return null

        return Array.from(this.networks.values()).find(
            network => network.chainId === this.connection!.chainId
        ) || null
    }

    isConnected(): boolean {
        return this.connection?.connected || false
    }

    // Cleanup
    cleanup(): void {
        this.disconnect()
        this.eventListeners.clear()
        this.transactions.clear()
        this.contracts.clear()
    }
}

// React hook for blockchain integration
import { useEffect, useState } from "react"

export function useBlockchain() {
    const [connection, setConnection] = useState<WalletConnection | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [nfts, setNfts] = useState<NFTMetadata[]>([])
    const [defiPositions, setDefiPositions] = useState<DeFiPosition[]>([])
    const blockchain = BlockchainManager.getInstance()

    useEffect(() => {
        const handleWalletConnected = (conn: WalletConnection) => {
            setConnection(conn)
            setIsConnecting(false)
            loadUserData(conn.address)
        }

        const handleWalletDisconnected = () => {
            setConnection(null)
            setTransactions([])
            setNfts([])
            setDefiPositions([])
        }

        const handleTransactionSent = (tx: Transaction) => {
            setTransactions(prev => [tx, ...prev])
        }

        blockchain.on('walletConnected', handleWalletConnected)
        blockchain.on('walletDisconnected', handleWalletDisconnected)
        blockchain.on('transactionSent', handleTransactionSent)

        // Check if already connected
        const existingConnection = blockchain.getConnection()
        if (existingConnection) {
            setConnection(existingConnection)
            loadUserData(existingConnection.address)
        }

        return () => {
            blockchain.off('walletConnected', handleWalletConnected)
            blockchain.off('walletDisconnected', handleWalletDisconnected)
            blockchain.off('transactionSent', handleTransactionSent)
        }
    }, [blockchain])

    const loadUserData = async (address: string) => {
        try {
            const [userNFTs, userPositions] = await Promise.all([
                blockchain.getNFTs(address),
                blockchain.getDeFiPositions(address)
            ])

            setNfts(userNFTs)
            setDefiPositions(userPositions)
        } catch (error) {
            console.error('Failed to load user data:', error)
        }
    }

    const connectWallet = async (provider: 'metamask' | 'walletconnect' | 'coinbase' = 'metamask') => {
        setIsConnecting(true)
        try {
            await blockchain.connectWallet(provider)
        } catch (error) {
            setIsConnecting(false)
            throw error
        }
    }

    return {
        connection,
        isConnecting,
        transactions,
        nfts,
        defiPositions,
        connectWallet,
        disconnect: blockchain.disconnect.bind(blockchain),
        switchNetwork: blockchain.switchNetwork.bind(blockchain),
        sendTransaction: blockchain.sendTransaction.bind(blockchain),
        getTokenBalance: blockchain.getTokenBalance.bind(blockchain),
        swapTokens: blockchain.swapTokens.bind(blockchain),
        mintNFT: blockchain.mintNFT.bind(blockchain),
        transferNFT: blockchain.transferNFT.bind(blockchain),
        getTokenPrice: blockchain.getTokenPrice.bind(blockchain),
        resolveENS: blockchain.resolveENS.bind(blockchain),
        uploadToIPFS: blockchain.uploadToIPFS.bind(blockchain),
        isConnected: blockchain.isConnected.bind(blockchain),
        getCurrentNetwork: blockchain.getCurrentNetwork.bind(blockchain),
        getNetworks: blockchain.getNetworks.bind(blockchain)
    }
}

// Export singleton instance
export const blockchain = BlockchainManager.getInstance()

// Example usage:
/*
import { useBlockchain } from "~blockchain-integration"

function Web3Component() {
  const {
    connection,
    isConnecting,
    transactions,
    nfts,
    connectWallet,
    sendTransaction,
    swapTokens
  } = useBlockchain()
  
  const handleConnect = async () => {
    try {
      await connectWallet('metamask')
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }
  
  const handleSwap = async () => {
    if (connection) {
      const result = await swapTokens(
        '0xA0b86a33E6441E6C7D3E4C5B4B6B8B8B8B8B8B8B', // USDC
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '100',
        '0.05'
      )
      console.log('Swap result:', result)
    }
  }
  
  if (!connection) {
    return (
      <button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }
  
  return (
    <div>
      <h2>Web3 Dashboard</h2>
      <div>Address: {connection.address}</div>
      <div>Balance: {connection.balance} ETH</div>
      <div>NFTs: {nfts.length}</div>
      <div>Transactions: {transactions.length}</div>
      
      <button onClick={handleSwap}>Swap Tokens</button>
    </div>
  )
}
*/