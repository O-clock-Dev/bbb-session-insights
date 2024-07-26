import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Login from "../components/Login";
import CourseList from "../components/CourseList";

function isAuthorized(email) {
  return email.endsWith('@oclock.io');
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session && isAuthorized(session.user.email) || process.env.SKIP_KEYCLOAK === 'true') {
    return (
      <div className="flex flex-col justify-center items-center text-2xl">
        <div className="items-center justify-center border-1 flex flex-col">
          <img
            className="mb-8 rounded-full w-48 h-48"
            src="https://oclock.io/wp-content/uploads/2023/11/logo-noir-blanc-rouge-768x768_centre-rond720px.png"
            alt="Logo O'clock"
          ></img>
          <div>
            Liste des dashboard d&apos;activités apprenant sur{" "}
            {process.env.LEARNING_DASHBOARD_BASEURL}{" "}
          </div>
          <CourseList></CourseList>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen flex flex-col justify-center items-center text-2xl">
      <img
        className="mb-8 rounded-full w-48 h-48"
        src="https://oclock.io/wp-content/uploads/2023/11/logo-noir-blanc-rouge-768x768_centre-rond720px.png"
        alt="Logo O'clock"
      ></img>
      <div className="mt-2">
        Connectez-vous sur Keycloak pour voir la liste des dashboard
      </div>
      <Login />
    </div>
  );
}
