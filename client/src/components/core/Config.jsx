import { BigNumber } from 'ethers';
import { useContext } from 'react';
import { Web2Context, Web3Context } from '../../App';
import { Accordion, Card, Col, Container, Row } from 'react-bootstrap';
import { GetBalance } from '../wagmi/GetBalance';
import { SendGasForm } from '../wagmi/SendGasForm';

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

export default function Config() {
  const { report, getReport } = useContext(Web2Context);
  const { network, account, signer } = useContext(Web3Context);

  return (
    <Container>
      <Row>
        <Card as={Col} text="black">
          <Card.Body>
            <Card.Title>Control Panel</Card.Title>
            <hr />
            <Accordion defaultActiveKey={['0']}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>General Information</Accordion.Header>
                <Accordion.Body>
                  <h6>Balance</h6>
                  Address: {report.deployer}
                  <GetBalance addressOrName={report.deployer} watch={true} />
                  <br />
                  <SendGasForm to={report.deployer} />
                  <hr />
                  <h6>Available Networks</h6>
                  <ul>
                    {report.networks.map((name) => (
                      <li key={`available-network-general-info-${name}`}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>Item</Accordion.Header>
                <Accordion.Body>
                  <h6>Available:</h6>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Card.Body>
        </Card>
      </Row>
    </Container>
  );
}
