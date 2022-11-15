import { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { useSignMessage } from 'wagmi';
import { DappContext } from '../../App';

export function Authorize() {
  const { signature, message, onSignature } = useContext(DappContext);
  const normalized = { message: message.current };
  const { isLoading, signMessageAsync } = useSignMessage(normalized);

  function handleClick(event) {
    event.preventDefault();
    signMessageAsync().then((data) => onSignature(data));
  }

  return (
    <Button
      disabled={isLoading || signature}
      onClick={handleClick}
      variant="danger"
    >
      Authorize
    </Button>
  );
}
