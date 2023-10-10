import { IconListStyle } from '../styles';
import DeleteAction from './TableActions/DeleteAction';
import EditAction from './TableActions/EditAction';

function PipelineActions({
	editAction,
	deleteAction,
}: PipelineActionsProps): JSX.Element {
	return (
		<IconListStyle>
			<EditAction editAction={editAction} isPipelineAction />
			<DeleteAction deleteAction={deleteAction} isPipelineAction />
		</IconListStyle>
	);
}

export interface PipelineActionsProps {
	editAction: VoidFunction;
	deleteAction: VoidFunction;
}
export default PipelineActions;
