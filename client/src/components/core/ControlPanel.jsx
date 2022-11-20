import { useContext } from 'react';
import { ApiContext } from '../../App';
import { SendGasForm } from '../wagmi/SendGasForm';
import { Accordion } from 'react-bootstrap';
import { BigNumber } from 'ethers';
import CustomConfig from './CustomConfig';
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
  const { report } = useContext(ApiContext);

  return (
    <Accordion defaultActiveKey={['0']}>
      <Accordion.Item eventKey="0">
        <Accordion.Header>General</Accordion.Header>
        <Accordion.Body>
          <h6>Administrator</h6>
          {report.admin}
          <hr />
          <Cashout />
          <hr />
          <h6>Top Up</h6>
          <SendGasForm to={report.deployer} />
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Config</Accordion.Header>
        <Accordion.Body>
          <CustomConfig />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
