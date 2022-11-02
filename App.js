import React, {useRef, useState} from 'react';

import {
  SafeAreaView,
  StatusBar,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import MetaMaskSDK from '@metamask/sdk';
import {Linking} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {ethers} from 'ethers';

const App = () => {
  const ethereum = useRef(null);
  const provider = useRef(null);
  const transactionResult = useRef(null);
  const signature = useRef(null);
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const msg = 'Hello from Dapp';

  const initializeSdk = async () => {
    try {
      console.log('in start of initialize func');
      if (!ethereum.current?.selectedAddress) {
        const MMSDK = new MetaMaskSDK({
          openDeeplink: link => {
            Linking.openURL(link).catch(() => {
              //Do Nothing
            }); // Use React Native Linking method or your favourite way of opening deeplinks
          },
          timer: BackgroundTimer, // To keep the app alive once it goes to background
          dappMetadata: {
            name: 'My RN Dapp', // The name of your application
            url: 'https://rndapp.com', // The url of your website
          },
        });

        ethereum.current = MMSDK.getProvider();

        ethereum.current
          .request({method: 'eth_requestAccounts'})
          .then(accounts => {
            console.log({accounts});
            console.log({selectedAddress: ethereum.current.selectedAddress});
            provider.current = new ethers.providers.Web3Provider(
              ethereum.current,
            );

            getBalance();
            // Get the balance of an account (by address or ENS name, if supported by network)
          });
      } else {
        Alert.alert('Wallet already connected');
      }

      // Often you need to format the output to something more user-friendly,
      // such as in ether (instead of wei)
    } catch (err) {
      Alert.alert(err);
    }
  };

  const getBalance = () => {
    setIsLoading(true);
    if (ethereum.current?.selectedAddress) {
      provider.current
        .getBalance(ethereum.current.selectedAddress)
        .then(_balance => {
          console.log({_balance});
          const balanceInETH = ethers.utils.formatEther(_balance);
          setBalance(balanceInETH);
          setIsLoading(false);
          console.log({balanceInETH});
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      Alert.alert('Connect Wallet to get balance');
    }
  };

  const sendTransaction = () => {
    const params = [
      {
        from: ethereum.current.selectedAddress,
        to: '0x3E1568D4ab414e776BAE3aef5c8Bd7Bf29E30D56',
        value: '0x2386F26FC10000',
      },
    ];

    ethereum.current
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then(result => {
        transactionResult.current = result;
        getBalance();
      })
      .catch(error => {
        console.log({error});
      });
  };

  const signTransaction = () => {
    const nonce = Date.now();
    const params = [msg, ethereum.current.selectedAddress, nonce];
    console.log({params});

    ethereum.current
      .request({
        method: 'personal_sign',
        params,
      })
      .then(result => {
        signature.current = result;
        verifyAccount();
        getBalance();
      })
      .catch(error => {
        console.log({error});
      });
  };

  const verifyAccount = () => {
    // ethereum.current
    //   .request({
    //     method: 'personal_ecRecover',
    //     params: [msg, signature.current],
    //   })
    //   .then(result => {
    //     console.log({result});
    //     if (ethereum.current.selectedAddress == result) {
    //       console.log('Verified');
    //     }
    //   })
    //   .catch(error => {
    //     console.log({error});
    //   });
    const verifiedAccountAddress = ethers.utils
      .verifyMessage(msg, signature.current)
      ?.toLowerCase();
    console.log({
      verifiedAccountAddress,
      selectedAddress: ethereum.current.selectedAddress,
    });
    if (verifiedAccountAddress === ethereum.current.selectedAddress) {
      ToastAndroid.show('Account Verified', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={style.screen}>
      <StatusBar barStyle={'dark-content'} />
      {ethereum.current?.selectedAddress ? (
        <Text style={style.accountText}>
          Account: {ethereum.current?.selectedAddress}
        </Text>
      ) : null}
      <Text onPress={initializeSdk} style={style.buttonStyle}>
        Connect to MetaMask
      </Text>
      {/* <Text onPress={getBalance} style={style.buttonStyle}>
        Fetch Balance
      </Text> */}
      {isLoading ? (
        <ActivityIndicator animating={isLoading} size={'large'} />
      ) : null}
      {balance ? (
        <Text style={style.balanceText}>Balance: {balance} ETH</Text>
      ) : null}
      <Text onPress={sendTransaction} style={style.buttonStyle}>
        Send Transaction
      </Text>
      {transactionResult.current ? (
        <Text style={style.balanceText}>
          Transaction Hash: {transactionResult.current}
        </Text>
      ) : null}
      <Text onPress={signTransaction} style={style.buttonStyle}>
        Sign Transaction
      </Text>
      {signature.current ? (
        <Text style={style.balanceText}>Signature: {signature.current}</Text>
      ) : null}
    </SafeAreaView>
  );
};

export default App;

const style = new StyleSheet.create({
  screen: {justifyContent: 'center', flex: 1, backgroundColor: 'white'},
  buttonStyle: {
    borderWidth: 1,
    padding: 5,
    marginHorizontal: 10,
    marginVertical: 20,
    textAlign: 'center',
    borderRadius: 6,
    backgroundColor: 'purple',
    color: 'white',
  },
  balanceText: {textAlign: 'center'},
  accountText: {textAlign: 'center', marginVertical: 10},
});
