import "./Table.css";
import { ReactNode } from "react";

type Props = {

    children:ReactNode;

};

export default function Table({

    children

}:Props){

return(

<div className="ri-table-container">

<table className="ri-table">

{children}

</table>

</div>

);

}