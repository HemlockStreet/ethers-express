import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
  useBalance,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from 'wagmi';

import {
  Card,
  Col,
  Button,
  Form,
  InputGroup,
  Accordion,
} from 'react-bootstrap';
import { ObjectDisplay } from '../../ObjectDisplay';

import { parseEther } from 'ethers/lib/utils';

import { CombinedNftForm } from '../AdminPanel/DiagnosticsCard/CombinedNftForm';

export function DiagnosticsCard(props) {
  const { info } = props;

  const balance = useBalance({
    addressOrName: info.deployer,
    watch: true,
    formatUnits: 'wei',
  });

  const [amount, setAmount] = useState('0');
  const [debouncedAmount] = useDebounce(amount, 500);

  const { config } = usePrepareSendTransaction({
    request: {
      to: info.deployer,
      value: debouncedAmount ? parseEther(debouncedAmount) : undefined,
    },
  });
  const { data, sendTransaction } = useSendTransaction(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
  });

  let toDisplay = {
    deployer: info.deployer,
    server: {
      type: 'standalone',
      skdb: info.server.skdb,
      asset: info.server.token,
      accessTier: info.server.accessTier,
      chainId: info.server.chainId,
    },
  };

  if (info.storeFront)
    toDisplay.storeFront = {
      type: 'default',
      skdb: info.server.skdb,
      asset: info.storeFront.address,
      accessTier: info.storeFront.accessTier,
      chainId: 'live',
    };

  return (
    <Card as={Col} text="black">
      <Card.Body>
        <Card.Title>Diagnostics</Card.Title>
        <hr />
        <Accordion defaultActiveKey={['1']}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Server</Accordion.Header>
            <Accordion.Body>
              <ObjectDisplay entity={toDisplay.server} />
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>StoreFront</Accordion.Header>
            <Accordion.Body>
              {info.storeFront.address ? (
                <ObjectDisplay entity={toDisplay.storeFront} />
              ) : (
                <div>
                  <h3>Deployment Required</h3>
                  <CombinedNftForm />
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Deployer</Accordion.Header>
            <Accordion.Body>
              <ul>
                <li>address: {info.deployer}</li>
                <li>
                  balance: {parseInt(balance.data?.formatted) / 10 ** 18}{' '}
                  {balance.data?.symbol}
                </li>
              </ul>
              <InputGroup>
                <InputGroup.Text
                  onClick={(e) => {
                    e.preventDefault();
                    if (isLoading || !sendTransaction || !amount) return;
                    sendTransaction?.();
                  }}
                  bg={
                    isLoading || !sendTransaction || !amount
                      ? 'info'
                      : 'primary'
                  }
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </InputGroup.Text>
                <Form.Control
                  name="value"
                  aria-label="Amount (ether)"
                  type="number"
                  placeholder="0.05"
                  min="0.000000000000000001"
                  onChange={(e) => {
                    if (e.target.value > 0) {
                      let val = e.target.value.toString();

                      if (Math.abs(val) < 1.0) {
                        var ex = parseInt(val.toString().split('e-')[1]);
                        if (ex) {
                          val *= Math.pow(10, ex - 1);
                          val =
                            '0.' +
                            new Array(ex).join('0') +
                            val.toString().substring(2);
                        }
                      } else {
                        var ex = parseInt(val.toString().split('+')[1]);
                        if (ex > 20) {
                          ex -= 20;
                          val /= Math.pow(10, ex);
                          val += new Array(ex + 1).join('0');
                        }
                      }

                      if (val !== amount) setAmount(val);
                    }
                  }}
                />
              </InputGroup>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
}
