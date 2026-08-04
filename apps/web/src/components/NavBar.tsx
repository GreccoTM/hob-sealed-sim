import { Link } from "react-router-dom";
import { useAuth } from "../state/authContext.js";

export function NavBar() {
  const { session, signOut } = useAuth();

  return (
    <div className="nav-bar">
      <Link to="/" className="brand">
        <span className="brand-mark">⚔</span> Sealed: The Hobbit
      </Link>
      {session && (
        <div className="nav-bar-user">
          <span>{session.user.email}</span>
          <button onClick={() => signOut()}>Sair</button>
        </div>
      )}
    </div>
  );
}
