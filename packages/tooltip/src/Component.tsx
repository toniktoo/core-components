import React, {
    FC,
    HTMLAttributes,
    ReactElement,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useRef,
    Fragment,
} from 'react';
import cn from 'classnames';

import { Popover, Position, PopoverProps } from '@alfalab/core-components-popover';

import styles from './index.module.css';

type Trigger = 'click' | 'hover';

type RefElement = HTMLElement | null;

export type TooltipProps = {
    /**
     * Контент тултипа
     */
    content: ReactNode;

    /**
     * Позиционирование тултипа
     */
    position?: Position;

    /**
     * Задержка перед открытием тултипа
     */
    onOpenDelay?: number;

    /**
     * Задержка перед закрытием тултипа
     */
    onCloseDelay?: number;

    /**
     * Обработчик открытия тултипа
     */
    onOpen?: () => void;

    /**
     * Обработчик закрытия тултипа
     */
    onClose?: () => void;

    /**
     * Событие, по которому происходит открытие тултипа
     */
    trigger?: Trigger;

    /**
     * Если `true`, то тултип будет открыт
     */
    open?: boolean;

    /**
     * Идентификатор для систем автоматизированного тестирования
     */
    dataTestId?: string;

    /**
     * Дочерние элементы тултипа.
     * При срабатывании событий на них, тултип будет открываться
     */
    children: ReactElement;

    /**
     * Смещение тултипа
     */
    offset?: [number, number];

    /**
     * Функция, возвращающая контейнер, в который будет рендериться тултип
     */
    getPortalContainer?: () => HTMLElement;

    /**
     * Дополнительный класс для стрелочки
     */
    arrowClassName?: string;

    /**
     * Дополнительный класс для контента
     */
    contentClassName?: string;

    /**
     * Дополнительный класс для поповера
     */
    popoverClassName?: string;

    /**
     * Дополнительный класс для обертки над дочерними элементами
     */
    targetClassName?: string;

    /**
     * Хранит функцию, с помощью которой можно обновить положение компонента
     */
    updatePopover?: PopoverProps['update'];
};

export const Tooltip: FC<TooltipProps> = ({
    children,
    content,
    trigger = 'hover',
    onCloseDelay = 300,
    onOpenDelay = 300,
    dataTestId,
    open: forcedOpen,
    offset = [0, 10],
    position,
    contentClassName,
    arrowClassName,
    popoverClassName,
    updatePopover,
    targetClassName,
    onClose,
    onOpen,
    getPortalContainer,
}) => {
    const [visible, setVisible] = useState(!!forcedOpen);
    const [target, setTarget] = useState<RefElement>(null);

    const targetRef = React.useRef<RefElement>(null);
    const contentRef = React.useRef<RefElement>(null);

    const timer = useRef(0);

    const open = () => {
        if (!visible) {
            setVisible(true);

            if (onOpen) {
                onOpen();
            }
        }
    };

    const close = useCallback(() => {
        if (visible) {
            setVisible(false);

            if (onClose) {
                onClose();
            }
        }
    }, [onClose, visible]);

    const toggle = () => {
        if (visible) {
            close();
        } else {
            open();
        }
    };

    const clickedOutside = (node: Element): boolean => {
        if (targetRef.current && targetRef.current.contains(node)) {
            return false;
        }

        if (contentRef.current && contentRef.current.contains(node)) {
            return false;
        }

        return true;
    };

    useEffect(() => {
        const handleBodyClick = (event: MouseEvent) => {
            const eventTarget = event.target as Element;

            if (clickedOutside(eventTarget)) {
                close();
            }
        };

        document.body.addEventListener('click', handleBodyClick);

        return () => {
            document.body.removeEventListener('click', handleBodyClick);

            clearTimeout(timer.current);
        };
    }, [close]);

    const handleTargetClick = () => {
        toggle();
    };

    const handleMouseOver = () => {
        clearTimeout(timer.current);

        timer.current = window.setTimeout(() => {
            open();
        }, onOpenDelay);
    };

    const handleMouseOut = () => {
        clearTimeout(timer.current);

        timer.current = window.setTimeout(() => {
            close();
        }, onCloseDelay);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        const eventTarget = event.target as Element;

        clearTimeout(timer.current);

        if (clickedOutside(eventTarget)) {
            timer.current = window.setTimeout(() => {
                close();
            }, onCloseDelay);
        } else {
            open();
        }
    };

    const onClickProps = { onClick: handleTargetClick };

    const onHoverProps = {
        onMouseOver: handleMouseOver,
        onMouseOut: handleMouseOut,
        onTouchStart: handleTouchStart,
    };

    const getTargetProps = (): HTMLAttributes<HTMLElement> => {
        const props = {
            className: cn(styles.target, targetClassName),
        };

        switch (trigger) {
            case 'click':
                return {
                    ...props,
                    ...onClickProps,
                };
            case 'hover':
                return {
                    ...props,
                    ...onHoverProps,
                };
            default:
                return {};
        }
    };

    const getContentProps = (): HTMLAttributes<HTMLElement> => {
        const props = {
            ref: contentRef,
            'data-test-id': dataTestId,
            className: cn(styles.component, contentClassName),
        };

        switch (trigger) {
            case 'hover':
                return {
                    ...props,
                    ...onHoverProps,
                };
            default:
                return props;
        }
    };

    const handleTargetRef = useCallback((ref: RefElement) => {
        targetRef.current = ref;

        setTarget(targetRef.current);
    }, []);

    const show = forcedOpen === undefined ? visible : forcedOpen;

    return (
        <Fragment>
            <div ref={handleTargetRef} {...getTargetProps()}>
                {children}
            </div>

            {target && (
                <Popover
                    anchorElement={target}
                    open={show}
                    getPortalContainer={getPortalContainer}
                    arrowClassName={arrowClassName}
                    popperClassName={styles.popper}
                    className={popoverClassName}
                    offset={offset}
                    withArrow={true}
                    position={position}
                    update={updatePopover}
                >
                    <div {...getContentProps()}>{content}</div>
                </Popover>
            )}
        </Fragment>
    );
};
