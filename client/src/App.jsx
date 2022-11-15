import { createContext, useRef, useState, useEffect, useContext } from 'react';
export const Web3Context = createContext(null);
export const Web2Context = createContext(null);

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import * as wagmi from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { Container, Row, Spinner } from 'react-bootstrap';

import NavigationBar from './components/core/NavigationBar';
import Config from './components/core/Config';

function Site() {
  const network = wagmi.useNetwork();
  const account = wagmi.useAccount();
  const signer = wagmi.useSigner();

  return (
    <div className="app">
      <Web3Context.Provider value={{ network, account, signer }}>
        <NavigationBar connect={true} />
        <Config />
      </Web3Context.Provider>
    </div>
  );
}

function Dapp() {
  const { report } = useContext(Web2Context);

  const selected = report.networks.map((name) => wagmi.chain[name]);
  const { chains, provider } = wagmi.configureChains(selected, [
    publicProvider(),
  ]);

  const wagmiClient = (name, autoConnect) => {
    const { connectors } = getDefaultWallets({ name, chains });
    return wagmi.createClient({ autoConnect, connectors, provider });
  };

  return (
    <wagmi.WagmiConfig client={wagmiClient('BackendFrontend', true)}>
      <RainbowKitProvider chains={chains}>
        <Site />
      </RainbowKitProvider>
    </wagmi.WagmiConfig>
  );
}

export function App() {
  // API Context
  const [report, setReport] = useState();
  const error = useRef();
  const loading = useRef(false);

  async function getReport() {
    if (loading.current === true) return;
    loading.current = true;
    try {
      const res = await fetch(`report`, {
        mode: 'cors',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
      setReport(await res.json());
    } catch (error) {
      error.current = error.toString();
    } finally {
      loading.current = false;
    }
  }

  useEffect(() => {
    if (!report) getReport();
  }, [report]);

  return (
    <div className="app">
      {report === undefined ? (
        <div>
          <NavigationBar />
          <Container>
            {loading.current === true && (
              <Row>
                <Spinner animation="border" variant="secondary" size="lg" />
                <p>Awaiting Backend Response...</p>
              </Row>
            )}

            {error.current !== undefined && (
              <Row>
                <h3>Failure</h3>
                <p>
                  {error}
                  <br />
                  Please Try Again Later...
                </p>
              </Row>
            )}
          </Container>
        </div>
      ) : (
        <Web2Context.Provider value={{ report, getReport }}>
          <Dapp />
        </Web2Context.Provider>
      )}
    </div>
  );
}
