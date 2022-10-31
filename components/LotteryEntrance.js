import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers, utils } from "ethers"
import { useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { chainId: chainHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayer, setNumPlayer] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [pricePool, setPricePool] = useState("0")

    const disptach = useNotification()

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numbersOfPlayers = (await getNumberOfPlayers()).toString()
        const recentWinner = (await getRecentWinner()).toString()

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const currentPrizePool = (await provider.getBalance(raffleAddress)).toString()

        setEntranceFee(entranceFeeFromCall)
        setNumPlayer(numbersOfPlayers)
        setRecentWinner(recentWinner)
        setPricePool(currentPrizePool)

        await new Promise(async (resolve, reject) => {
            provider.once("WinnerPicked", async () => {
                console.log("WinnerPicked event fired!")
                try {
                    console.log(111)
                    // // add our asserts here
                    // const recentWinner = await raffle.getRecentWinner()
                    // const raffleState = await raffle.getRaffleState()
                    // const winnerEndingBalance = await accounts[0].getBalance()
                    // const endingTimeStamp = await raffle.getLastTimeStamp()

                    resolve()
                } catch (error) {
                    console.log(error)
                    reject(error)
                }
            })
        })
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = function () {
        disptach({
            type: "success",
            message:
                "You Entered Raffle with:  " +
                ethers.utils.formatUnits(entranceFee, "ether") +
                " ETH",
            title: "Raffle Enter Success",
            position: "topR",
            // icon: "raffle",
        })
    }

    return (
        <div>
            {raffleAddress ? (
                <div className="py-5">
                    <div>Entrance Fee : {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div>
                    <div>
                        Current Prize Pool : {ethers.utils.formatUnits(pricePool, "ether")} ETH
                    </div>
                    <div>Number Of players : {numPlayer}</div>
                    <div>Recent Winner : {recentWinner}</div>
                    <button
                        className="w-full py-2 px-4 round text-white font-bold bg-blue-500 hover:bg-green-700  "
                        onClick={async function () {
                            await enterRaffle({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full "></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                </div>
            ) : (
                <div> No Raffle Address Detected</div>
            )}
        </div>
    )
}
