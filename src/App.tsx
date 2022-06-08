import React, { useEffect, useState } from 'react';
import abi from "./utils/WavePortal.json";
import './App.css';
import { ethers } from 'ethers';
import { Ethereumish } from './types/Ethereumish';

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
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
        }
      ]);
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
      } else {
        console.log("User didn't win ETH.");
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
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
          WELCOME!
        </div>

        <div className="bio">
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
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Wallet Connected
          </button>
        )}
       {/* waveボタンにwave関数を連動 */}
       {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
       {/* メッセージボックスを実装*/}
       {currentAccount && (
          <textarea
            name="messageArea"
            placeholder="メッセージはこちら"
            id="message"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
        )}
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
  );
}

export default App;
