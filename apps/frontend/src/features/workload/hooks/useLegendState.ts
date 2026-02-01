import { useMemo, useReducer } from "react";
import type { LegendAction, LegendState } from "@/features/workload/types";

function legendReducer(state: LegendState, action: LegendAction): LegendState {
	switch (action.type) {
		case "HOVER":
			if (state.mode === "pinned") return state;
			return {
				...state,
				mode: "hovering",
				activeMonth: action.yearMonth,
			};

		case "HOVER_LEAVE":
			if (state.mode === "pinned") return state;
			return {
				...state,
				mode: "initial",
				activeMonth: null,
			};

		case "CLICK":
			if (state.mode === "pinned" && state.pinnedMonth === action.yearMonth) {
				return {
					mode: "initial",
					activeMonth: null,
					pinnedMonth: null,
				};
			}
			return {
				mode: "pinned",
				activeMonth: action.yearMonth,
				pinnedMonth: action.yearMonth,
			};

		case "UNPIN":
			return {
				mode: "initial",
				activeMonth: null,
				pinnedMonth: null,
			};

		default:
			return state;
	}
}

const initialState: LegendState = {
	mode: "initial",
	activeMonth: null,
	pinnedMonth: null,
};

export interface UseLegendStateReturn {
	state: LegendState;
	dispatch: React.Dispatch<LegendAction>;
	activeMonth: string | null;
	isPinned: boolean;
}

export function useLegendState(
	latestMonth: string | null,
): UseLegendStateReturn {
	const [state, dispatch] = useReducer(legendReducer, initialState);

	const activeMonth = useMemo(() => {
		if (state.mode === "pinned") return state.pinnedMonth;
		if (state.mode === "hovering") return state.activeMonth;
		return latestMonth;
	}, [state.mode, state.pinnedMonth, state.activeMonth, latestMonth]);

	return {
		state,
		dispatch,
		activeMonth,
		isPinned: state.mode === "pinned",
	};
}
