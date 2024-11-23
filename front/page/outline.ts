import { Uri } from 'vscode';
import { DocNode, MsgType, ReqType } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { msg } from '../util/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { Node } from '../components/node';


export type Props = {};
type Data = {
  tree: AsyncState<DocNode[]>;
	uri: Uri
};

export const Outline: FC<Data, Props> = (data, props) => {
  const [run] = useAsync('tree', async (uri?: Uri) => {
    const res = await msg.request<DocNode[]>(
      ReqType.Command,
      ['fetchSymbol', uri]
    );
    if (Array.isArray(res.data)) {
			const first = res.data[0];
			data.uri = first.location.uri;
      return res.data;
    }
  });

	run();

  msg.on(MsgType.DocSwitch, run);

  return () => {
    console.log('treeValue', data);

    const { tree, uri } = data;
    return [
      el('div', {}, [
        tree.loading
          ? text('outline')
          : tree.value &&
            el(
              'div',
              {},
              tree.value.map(dt => fn(Node, { value: dt, uri }))
            )
      ])
    ];
  };
};
