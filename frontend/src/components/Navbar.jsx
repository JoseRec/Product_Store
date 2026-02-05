import { Link } from "react-router";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { ShoppingBagIcon, PlusIcon, UserIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";

/**
 * Top navigation bar with brand, theme selector, and authentication-dependent controls.
 *
 * Renders a logo linking to the homepage, a ThemeSelector, and either signed-in actions
 * (New Product, Profile, UserButton) or authentication buttons (Sign In, Get Started) based on the current user session.
 * @returns {JSX.Element} The navbar React element.
 */
function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="max-w-5xl mx-auto w-full px-4 flex justify-between items-center">
        {/* LOGO - LEFTSIDE */}
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost gap-2">
            <ShoppingBagIcon className="size-5 text-primary" />
            <span className="text-lg font-bold font-mono uppercase tracking-widest">
              ProductStore
            </span>
          </Link>
        </div>

        <div className="flex gap-2 items-center">
          <ThemeSelector />
          {isSignedIn ? (
            <>
              <Link to="/create" className="btn btn-primary btn-sm gap-1">
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">New Product</span>
              </Link>
              <Link to="/profile" className="btn btn-ghost btn-sm gap-1">
                <UserIcon className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="btn btn-ghost btn-sm">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-sm">Get Started</button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;