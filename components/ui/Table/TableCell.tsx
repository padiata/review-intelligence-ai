import { ReactNode } from "react";

type Props={

children:ReactNode;

header?:boolean;

};

export default function TableCell({

children,

header=false

}:Props){

if(header){

return(

<th>

{children}

</th>

);

}

return(

<td>

{children}

</td>

);

}