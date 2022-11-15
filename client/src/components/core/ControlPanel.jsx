import { useContext } from 'react';
import { Web2Context, Web3Context } from '../../App';
import { GetBalance } from '../wagmi/GetBalance';
import { SendGasForm } from '../wagmi/SendGasForm';
import { Accordion, Button, InputGroup } from 'react-bootstrap';
import { ConfigContext } from './Config';
import { BigNumber } from 'ethers';
import { ChangeRpc } from './ChangeRpc';
import { SetScannerKey } from './SetScannerKey';
import { Cashout } from './Cashout';

export const uint = (bigNumber) => parseInt(bigNumber.toString());
export const mixed = (res) =>
  res.map((val) => {
    if (typeof val === 'object') {
      if (Array.isArray(val)) return mixed(val);
      else if (BigNumber.isBigNumber(val)) return uint(val);
      else return val.toString();
    }
    return val;
  });
export const contractInterface = (name) =>
  require(`../wagmi/interfaces/${name}.json`).abi;

export default function ControlPanel() {
  const { report, getReport } = useContext(Web2Context);
  const { network, account, signer } = useContext(Web3Context);
  const { message, resetMessage, signature, setSignature } =
    useContext(ConfigContext);

  //   fetch('test', {
  //     method: 'POST',
  //     mode: 'cors',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(chain),
  //   });

  return (
    <Accordion defaultActiveKey={['0']}>
      <Accordion.Item eventKey="0">
        <Accordion.Header>General</Accordion.Header>
        <Accordion.Body>
          <h6>Administrator</h6>
          {report.credentials}
          <hr />
          <h6>Balance</h6>
          Fiduciary: {report.deployer}
          <GetBalance addressOrName={report.deployer} watch={true} />
          <hr />
          <Cashout />
          <hr />
          <h6>Top Up</h6>
          <SendGasForm to={report.deployer} />
          <hr />
          <h6>Available Networks</h6>
          <ul>
            {report.networks.map((name) => (
              <li key={`available-network-general-info-${name}`}>{name}</li>
            ))}
          </ul>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Config</Accordion.Header>
        <Accordion.Body>
          <ChangeRpc />
          <hr />
          <SetScannerKey />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
