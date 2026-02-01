import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface DebouncedSearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	delay?: number;
}

export function DebouncedSearchInput({
	value,
	onChange,
	placeholder,
	className,
	delay = 300,
}: DebouncedSearchInputProps) {
	const [localValue, setLocalValue] = useState(value);
	const [prevValue, setPrevValue] = useState(value);
	const [isComposing, setIsComposing] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	if (prevValue !== value && !isComposing) {
		setPrevValue(value);
		setLocalValue(value);
	}

	const emitChange = useCallback(
		(nextValue: string) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			timerRef.current = setTimeout(() => {
				onChange(nextValue);
			}, delay);
		},
		[onChange, delay],
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value;
		setLocalValue(next);
		if (!isComposing) {
			emitChange(next);
		}
	};

	const handleCompositionStart = () => {
		setIsComposing(true);
	};

	const handleCompositionEnd = (
		e: React.CompositionEvent<HTMLInputElement>,
	) => {
		setIsComposing(false);
		const next = e.currentTarget.value;
		setLocalValue(next);
		emitChange(next);
	};

	return (
		<Input
			placeholder={placeholder}
			value={localValue}
			onChange={handleChange}
			onCompositionStart={handleCompositionStart}
			onCompositionEnd={handleCompositionEnd}
			className={className}
		/>
	);
}
