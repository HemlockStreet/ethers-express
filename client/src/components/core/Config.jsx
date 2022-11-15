import { useContext, useRef, useState, createContext } from 'react';
import { Web2Context, Web3Context } from '../../App';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

import cryptoRandomString from 'crypto-random-string';
import GetSignature from '../wagmi/SignMessage';
import ControlPanel from './ControlPanel';

export const ConfigContext = createContext(null);

const newMessage = () =>
  cryptoRandomString({
    length: 132,
    type: 'alphanumeric',
  });

export default function Config() {
  const [signature, setSignature] = useState();
  const message = useRef(newMessage());
  const resetMessage = () => (message.current = newMessage());
  const { report } = useContext(Web2Context);
  const { account } = useContext(Web3Context);

  function handleImprint(event) {
    event.preventDefault();
    const user = {
      address: account.address,
      message: Object.keys(signature)[0],
      signature: signature[Object.keys(signature)[0]],
    };
    fetch('report', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
        window.location.reload();
      })
      .catch((e) => {
        console.error(e.toString());
      });
  }

  return (
    <ConfigContext.Provider
      value={{ message, resetMessage, signature, setSignature }}
    >
      <Container>
        <Row>
          <Card as={Col} text="black">
            <Card.Body>
              <Card.Title>Control Panel</Card.Title>
              <hr />
              {report.credentials ? (
                <ControlPanel />
              ) : (
                <div>
                  <h3>First Time Setup</h3>
                  {!signature ? (
                    <div>
                      <p>Please Sign this Message to imprint on the backend.</p>
                      <GetSignature />
                    </div>
                  ) : (
                    <div>
                      <p>
                        Ready to imprint. Please make sure you are not using a
                        wallet with a compromised key.
                      </p>
                      <Button onClick={handleImprint}>Send</Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Row>
      </Container>
    </ConfigContext.Provider>
  );
}
