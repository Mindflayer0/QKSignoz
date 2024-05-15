import {
	EditFilled,
	ImportOutlined,
	PlusOutlined,
	ShareAltOutlined,
} from '@ant-design/icons';
import TextToolTip from 'components/TextToolTip';
import useAnalytics from 'hooks/analytics/useAnalytics';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActionMode,
	ActionType,
	Pipeline,
	PipelineData,
} from 'types/api/pipeline/def';

import { ButtonContainer, CustomButton } from '../../styles';
import PipelinesExportModal from './PipelinesExportModal';
import PipelinesImportModal from './PipelinesImportModal/PipelinesImportModal';

function PipelinesActions({
	setActionType,
	isActionMode,
	setActionMode,
	pipelineData,
	setCurrentPipelines,
}: PipelinesActionsProps): JSX.Element {
	const { t } = useTranslation(['pipeline']);
	const { trackEvent } = useAnalytics();

	const [isExportModalVisible, setIsExportModalVisible] = useState(false);
	const [isImportModalVisible, setIsImportModalVisible] = useState(false);

	const pipelinesExist = useMemo(() => pipelineData?.pipelines?.length > 0, [
		pipelineData?.pipelines,
	]);
	const inEditMode = isActionMode === ActionMode.Editing;

	const onEnterEditMode = (): void => {
		setActionMode(ActionMode.Editing);

		trackEvent('Logs: Pipelines: Entered Edit Mode', {
			source: 'signoz-ui',
		});
	};
	const onAddNewPipeline = (): void => {
		setActionMode(ActionMode.Editing);
		setActionType(ActionType.AddPipeline);

		trackEvent('Logs: Pipelines: Clicked Add New Pipeline', {
			source: 'signoz-ui',
		});
	};

	return (
		<>
			<ButtonContainer>
				<TextToolTip
					text={t('learn_more')}
					url="https://signoz.io/docs/logs-pipelines/introduction/"
				/>
				{pipelinesExist && !inEditMode && (
					<CustomButton
						onClick={(): void => setIsExportModalVisible(true)}
						icon={<ShareAltOutlined />}
					>
						{t('share_pipelines')}
					</CustomButton>
				)}
				{(inEditMode || !pipelinesExist) && (
					<CustomButton
						onClick={(): void => {
							onEnterEditMode();
							setIsImportModalVisible(true);
						}}
						icon={<ImportOutlined />}
					>
						{t('import_pipelines')}
					</CustomButton>
				)}
				{pipelinesExist && (
					<CustomButton
						icon={<EditFilled />}
						onClick={onEnterEditMode}
						disabled={inEditMode}
					>
						{t('enter_edit_mode')}
					</CustomButton>
				)}
				{!pipelinesExist && (
					<CustomButton
						icon={<PlusOutlined />}
						onClick={onAddNewPipeline}
						type="primary"
					>
						{t('new_pipeline')}
					</CustomButton>
				)}
			</ButtonContainer>
			<PipelinesExportModal
				open={isExportModalVisible}
				onClose={(): void => setIsExportModalVisible(false)}
				pipelines={pipelineData.pipelines}
			/>
			<PipelinesImportModal
				open={isImportModalVisible}
				onClose={(): void => setIsImportModalVisible(false)}
				setCurrentPipelines={setCurrentPipelines}
			/>
		</>
	);
}

interface PipelinesActionsProps {
	setActionType: (actionType: string) => void;
	isActionMode: string;
	setActionMode: (actionMode: string) => void;
	pipelineData: Pipeline;
	setCurrentPipelines: (
		value: React.SetStateAction<Array<PipelineData>>,
	) => void;
}

export default PipelinesActions;
