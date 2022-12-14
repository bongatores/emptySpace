
import React from 'react'
import {
    Spinner,
    Paragraph,
} from 'grommet';

import MyENS from './MyENS';

export default function ConnectENSSection(props) {
    return (
        <>
            {
                (!props.graphErr && props.client) ?
                    <>
                        <MyENS myOwnedENS={props.myOwnedENS}
                            setMetadata={props.setMetadata}
                        />
                    </> :
                    !props.client &&
                    <>
                        <Paragraph>Sorry! Could not load your ENS (subgraph can be syncing), try changing network or enter as guest.</Paragraph>
                    </>

            }

        </>
    )
}
