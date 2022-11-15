import { useContext, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useSignMessage } from 'wagmi';
import { ConfigContext } from '../core/Config';

export default function GetSignature() {
  const { message, resetMessage, setSignature } = useContext(ConfigContext);
  const { isLoading, signMessageAsync } = useSignMessage({
    message: message.current,
  });

  function handleClick(event) {
    event.preventDefault();
    console.log();
    signMessageAsync().then((data) => {
      setSignature({ [message.current]: data });
      resetMessage();
    });
  }

  return (
    <Button disabled={isLoading} onClick={handleClick}>
      Sign Message
    </Button>
  );
}
