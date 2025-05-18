import { useParams } from "react-router";

export default function Route() {
  const { id } = useParams();
  return <div>Route {id}</div>;
}
