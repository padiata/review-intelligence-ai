import { ReactNode } from "react";

type Props={

children:ReactNode;

};

export default function TableRow({

children

}:Props){

return(

<tr>

{children}

</tr>

);

}