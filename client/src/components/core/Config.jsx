import { useContext, useRef, useState, createContext } from 'react';
import { ApiContext, DappContext } from '../../App';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

import { Authorize } from '../buttons/Authorize';
import ControlPanel from './ControlPanel';

export default function Config() {
  const { user, signature } = useContext(DappContext);
  const { report } = useContext(ApiContext);

  const validating = useRef(false);
  const [feedback, setFeedback] = useState();

  function handleImprint(event) {
    event.preventDefault();
    if (validating.current) return;
    validating.current = true;
    fetch('config', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user.current, input: { target: 'setup' } }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            `${res.status} - ${res.statusText} - ${data.toString()}`
          );
        await new Promise((r) => setTimeout(r, 3000));
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
            {report.admin ? (
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
                    <Button
                      disabled={validating.current}
                      onClick={handleImprint}
                    >
                      Send
                    </Button>
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
