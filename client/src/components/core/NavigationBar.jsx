import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function NavigationBar(props) {
  const { connect } = props;

  function handleClick(event) {
    event.preventDefault();
    // setPage(event.target.name);
  }

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="" name="home" onClick={handleClick}>
            BackendFrontend
          </Navbar.Brand>
          {connect && <ConnectButton />}
        </Container>
      </Navbar>

      <hr />
      <br />
    </div>
  );
}
