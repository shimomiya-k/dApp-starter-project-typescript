import React, { useEffect, useState } from 'react';
import abi from "./utils/WavePortal.json";
import './App.css';
import { ethers } from 'ethers';
import { Ethereumish } from './types/Ethereumish';
import bgImage from "./images/cat.jpg";　

declare global {
  interface Window {
    ethereum: Ethereumish;
  }
}

type Wave = {
  address: any;
  timestamp: any;
  message: string;
};

function App() {
  /* ユーザーのパブリックウォレットを保存するために使用する状態変数を定義します */
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [allWaves, setAllWaves] = useState<Wave[]>([]);
  console.log("currentAccount: ", currentAccount);

  const contractAddress = "0x9555f8515c5b9013D43f7E290b7E7C43bb1B0EB4";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;
    try {
      if (!ethereum) {
        console.log("Ethereum object doesn't exist!");
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      const waves = await wavePortalContract.getAllWaves() as any[];
      const wavesCleaned: Wave[] = waves.map((wave) => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });

      setAllWaves(wavesCleaned);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let wavePortalContract: any;

    const onNewWave = (from: any, timestamp: any, message: any) => {
      console.log("NewWave", from, timestamp, message);
      getAllWaves();
      // setAllWaves((prevState) => [
      //   ...prevState,
      //   {
      //     address: from,
      //     timestamp: new Date(timestamp * 1000),
      //     message,
      //   }
      // ]);
    };

    const { ethereum } = window;
    if (!ethereum) {
      console.log("Ethereum object doesn't exist!");
      return () => {
        if (wavePortalContract) {
          wavePortalContract.off("NewWave", onNewWave);
        }
      };
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
    getAllWaves();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      }
  
      console.log("We have the ethereum object", ethereum);
  
      const accounts = await ethereum.request!({ method: "eth_accounts" });
      console.log(accounts);
      if (accounts.length === 0) {
        console.log("No authorized account found");
        return;
      }
  
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request!({ method: "eth_requestAccounts" });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const wave = async () => {
    console.log("try wave!");
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Ethereum object doesn't exist!");
        return;
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      let count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
      console.log("Signer:", signer);

      let contractBalance = await provider.getBalance(wavePortalContract.address);
      console.log("Contract balance:", ethers.utils.formatEther(contractBalance));
      
      const waveTxn = await wavePortalContract.wave(messageValue, {
        gasLimit: 300000,
      });
      console.log("Mining...", waveTxn.hash);
      await waveTxn.wait();
      console.log("Mined -- ", waveTxn.hash);
      count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());

      let contractBalance_post = await provider.getBalance(
        wavePortalContract.address
      );
      console.log("contractBalance: ", contractBalance);
      console.log("contractBalance_post: ", contractBalance_post);
      /* コントラクトの残高が減っていることを確認 */
      if (contractBalance_post < contractBalance) {
        /* 減っていたら下記を出力 */
        console.log("User won ETH!");
        setResultValue("You won ETH!");
      } else {
        console.log("User didn't win ETH.");
        setResultValue("You didn't win ETH.");
      }
      console.log(
        "Contract balance after wave:",
        ethers.utils.formatEther(contractBalance_post)
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="flex h-screen">
      <div className='flex-1 overflow-hidden'>
        <img className='w-full h-full object-cover' src={bgImage} alt="cat" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className='flex-1 flex flex-col justify-center items-center space-y-5'>
          <div className="header">
            <span role="img" aria-label="hand-wave">
              👋
            </span>{" "}
            WELCOME!
          </div>

          <div className="px-3">
          イーサリアムウォレットを接続して、メッセージを作成したら、
            <span role="img" aria-label="hand-wave">
              👋
            </span>
          を送ってください
            <span role="img" aria-label="shine">
              ✨
            </span>
          </div>
          {/* ウォレットコネクトのボタンを実装 */}
          {!currentAccount && (
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
          {currentAccount && (
            <button className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={connectWallet}>
              Wallet Connected
            </button>
          )}
          <div className='flex space-x-2.5 w-full px-3'>
            {/* メッセージボックスを実装*/}
            {currentAccount && (
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  name="messageArea"
                  placeholder="メッセージはこちら"
                  id="message"
                  value={messageValue}
                  onChange={(e) => setMessageValue(e.target.value)}
                />
              )}
            {/* waveボタンにwave関数を連動 */}
            {currentAccount && (
                <button className="w-40 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={wave}>
                  Wave at Me
                </button>
            )}
          </div>
          <div>
            {resultValue}
          </div>
        </div>
        <div className='flex-1 overflow-auto'>
          {/* 履歴を表示する */}
          {currentAccount &&
            allWaves
              .slice(0)
              .reverse()
              .map((wave, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#F8F8FF",
                      marginTop: "16px",
                      padding: "8px",
                    }}
                  >
                    <div>Address: {wave.address}</div>
                    <div>Time: {wave.timestamp.toString()}</div>
                    <div>Message: {wave.message}</div>
                  </div>
                );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
