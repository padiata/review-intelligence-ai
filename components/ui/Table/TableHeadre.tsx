import { ReactNode } from "react";

type Props={

children:ReactNode;

};

export default function TableHeader({

children

}:Props){

return(

<thead>

<tr>

{children}

</tr>

</thead>

);

}