import { useState } from "react";

export type MasterSheetState<TEntity> =
	| { mode: "closed" }
	| { mode: "view"; entity: TEntity }
	| { mode: "edit"; entity: TEntity }
	| { mode: "create" };

export function createMasterSheetActions<TEntity>(
	current: MasterSheetState<TEntity>,
) {
	return {
		openView: (entity: TEntity): MasterSheetState<TEntity> => ({
			mode: "view",
			entity,
		}),

		openCreate: (): MasterSheetState<TEntity> => ({
			mode: "create",
		}),

		switchToEdit: (): MasterSheetState<TEntity> => {
			if (current.mode === "view") {
				return { mode: "edit", entity: current.entity };
			}
			return current;
		},

		switchToView: (updatedEntity?: TEntity): MasterSheetState<TEntity> => {
			if (current.mode === "edit") {
				return {
					mode: "view",
					entity: updatedEntity ?? current.entity,
				};
			}
			return current;
		},

		close: (): MasterSheetState<TEntity> => ({
			mode: "closed",
		}),
	};
}

export interface UseMasterSheetReturn<TEntity> {
	state: MasterSheetState<TEntity>;
	isOpen: boolean;
	openView: (entity: TEntity) => void;
	openCreate: () => void;
	switchToEdit: () => void;
	switchToView: (updatedEntity?: TEntity) => void;
	close: () => void;
}

export function useMasterSheet<TEntity>(): UseMasterSheetReturn<TEntity> {
	const [state, setState] = useState<MasterSheetState<TEntity>>({
		mode: "closed",
	});

	const actions = createMasterSheetActions(state);

	return {
		state,
		isOpen: state.mode !== "closed",
		openView: (entity: TEntity) => setState(actions.openView(entity)),
		openCreate: () => setState(actions.openCreate()),
		switchToEdit: () => setState(actions.switchToEdit()),
		switchToView: (updatedEntity?: TEntity) =>
			setState(actions.switchToView(updatedEntity)),
		close: () => setState(actions.close()),
	};
}
