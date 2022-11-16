import { useContext, useRef, useState, createContext } from 'react';
import { ApiContext, DappContext, WagmiContext } from '../../App';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

import cryptoRandomString from 'crypto-random-string';
import { Authorize } from '../buttons/Authorize';
import ControlPanel from './ControlPanel';

export const ConfigContext = createContext(null);

const newMessage = () =>
  cryptoRandomString({
    length: 132,
    type: 'alphanumeric',
  });

export default function Config() {
  const { user, signature, onRequest } = useContext(DappContext);

  const { report } = useContext(ApiContext);

  const validating = useRef(false);
  const [feedback, setFeedback] = useState();

  function handleImprint(event) {
    event.preventDefault();
    if (validating.current) return;
    validating.current = true;
    fetch('report', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user.current }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            `${res.status} - ${res.statusText} - ${data.toString()}`
          );
        setFeedback(data.toString());
        onRequest();
        await new Promise((resolve) => setTimeout(resolve, 5000));
        window.location.reload();
      })
      .catch((e) => setFeedback(e.toString()))
      .finally(() => (validating.current = false));
  }

  return (
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
                    <Authorize />
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
                {feedback && <div>{feedback}</div>}
              </div>
            )}
          </Card.Body>
        </Card>
      </Row>
    </Container>
  );
}
