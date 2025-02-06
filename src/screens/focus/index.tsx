import { Indicator } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { Clock, Minus, Plus } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from 'react-timer-hook';

import { Button } from '../../components/button';
import { Header } from '../../components/header';
import { Info } from '../../components/info';
import { useUser } from '../../hooks/use-user';
import { api, isAxiosError } from '../../services/api';
import styles from './styles.module.css';

import 'dayjs/locale/pt-br';

dayjs.locale('pt-br'); // Define o idioma como padrão

type Timers = {
  focus: number;
  rest: number;
};

type FocusMetrics = {
  _id: [number, number, number];
  count: number;
};

type FocusTimes = {
  _id: string;
  timeFrom: string;
  timeTo: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

enum TimerState {
  PAUSED = 'PAUSED',
  FOCUS = 'FOCUS',
  REST = 'REST',
}

const TimerStateDescription = {
  [TimerState.PAUSED]: 'Pausado',
  [TimerState.FOCUS]: 'Em Foco',
  [TimerState.REST]: 'Descansando',
};

export function Focus() {
  // const weekDaysShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const [timers, setTimers] = useState<Timers>({ focus: 0, rest: 0 });
  const [timerState, setTimerState] = useState<TimerState>(TimerState.PAUSED);
  const inputFocus = useRef<HTMLInputElement>(null);
  const inputRest = useRef<HTMLInputElement>(null);
  const [timeFrom, setTimeFrom] = useState<Date | null>(null);
  const [focusMetrics, setFocusMetrics] = useState<FocusMetrics[]>([]);
  const [focusTimes, setFocusTimes] = useState<FocusTimes[]>([]);

  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(
    dayjs().startOf('month'),
  );
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(
    dayjs().startOf('day'),
  );

  const metricsInfoByDay = useMemo(() => {
    const timesMetrics = focusTimes.map((item) => ({
      timeFrom: dayjs(item.timeFrom),
      timeTo: dayjs(item.timeTo),
    }));

    if (timesMetrics.length) {
      const totalDiff = timesMetrics.reduce((total, item) => {
        return total + item.timeTo.diff(item.timeFrom, 'minutes');
      }, 0);

      console.log({ timesMetrics });
      return { timesMetrics, totalDiff };
    }
  }, [focusTimes, timerState]);

  const metricsInfoByMonth = useMemo(() => {
    let countByMonth = 0;
    const completedDates = focusMetrics.map((item) => {
      countByMonth += item.count;

      return {
        day: dayjs(`${item._id[0]}-${item._id[1]}-${item._id[2]}`)
          .startOf('day')
          .toISOString(),
        count: item.count,
      };
    });

    return { completedDates, countByMonth };
  }, [focusMetrics, timerState]);

  const { logout } = useUser();
  const navigate = useNavigate();

  const focusTimer = useTimer({
    // começo com ele expirado já, pra depois usar o restart e manipular com o tempo q eu quiser
    expiryTimestamp: new Date(),
    onExpire() {
      if (timerState !== TimerState.PAUSED) {
        handleEnd();
      }
    },
  });

  const restTimer = useTimer({
    // começo com ele expirado já, pra depois usar o restart e manipular com o tempo q eu quiser
    expiryTimestamp: new Date(),
  });

  function addSeconds(date: Date, seconds: number) {
    const time = dayjs(date).add(seconds, 'seconds');

    return time.toDate();
  }

  function handleStart() {
    const now = new Date();

    // focusTimer.restart(addSeconds(now, timers.focus * 60));
    focusTimer.restart(addSeconds(now, 5));

    setTimeFrom(now);
  }

  async function handleEnd() {
    try {
      await api.post('focus-time', {
        timeFrom: timeFrom?.toISOString(),
        timeTo: new Date().toISOString(),
      });

      loadFocusMetrics(currentMonth.toISOString());
      loadFocusTimes(currentDate.toISOString());
      setTimeFrom(null);
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.data.message === 'Token is invalid'
      ) {
        logout();

        navigate('/entrar');
      }
    }
  }

  function handleAddMinutes(type: 'focus' | 'rest') {
    if (type === 'focus') {
      const value = Number(inputFocus.current?.value.replace(/\D/g, '') || 0); // Remove não números

      if (inputFocus.current) {
        const newValue = `${value + 5} Minutos`;
        inputFocus.current.value = newValue;
        setTimers((old) => ({
          ...old,
          focus: value + 5,
        }));
      }
      return;
    }

    const value = Number(inputRest.current?.value.replace(/\D/g, '') || 0); // Remove não números

    if (inputRest.current) {
      const newValue = `${value + 2} Minutos`;
      inputRest.current.value = newValue;

      setTimers((old) => ({
        ...old,
        rest: value + 2,
      }));
    }
  }

  function handleSubtractMinutes(type: 'focus' | 'rest') {
    if (type === 'focus') {
      const value = Number(inputFocus.current?.value.replace(/\D/g, '') || 0); // Remove não números

      if (inputFocus.current) {
        if (value <= 5) {
          inputFocus.current.value = '';
          inputFocus.current.placeholder = 'Tempo de Foco';

          setTimers((old) => ({
            ...old,
            focus: value - 5,
          }));
          return;
        }

        const newValue = `${value - 5} Minutos`;
        inputFocus.current.value = newValue;

        setTimers((old) => ({
          ...old,
          focus: value - 5,
        }));
      }
      return;
    }

    const value = Number(inputRest.current?.value.replace(/\D/g, '') || 0); // Remove não números

    if (inputRest.current) {
      if (value <= 2) {
        inputRest.current.value = '';
        inputRest.current.placeholder = 'Descanso';

        setTimers((old) => ({
          ...old,
          rest: value - 2,
        }));
        return;
      }
      const newValue = `${value - 2} Minutos`;
      inputRest.current.value = newValue;

      setTimers((old) => ({
        ...old,
        rest: value - 2,
      }));
    }
  }

  function handleFocus() {
    if (!(timers.focus <= 0 || timers.rest <= 0)) {
      setTimerState(TimerState.FOCUS);

      handleStart();
    }
  }

  function handleRest() {
    focusTimer.pause();

    if (timeFrom) {
      handleEnd();
    }

    const now = new Date();

    // focusTimer.restart(addSeconds(now, timers.focus * 60));
    restTimer.restart(addSeconds(now, 5));

    setTimerState(TimerState.REST);
  }

  function handleResume() {
    restTimer.pause();

    setTimerState(TimerState.FOCUS);
    handleStart();
  }

  function handleCancel() {
    setTimers({ focus: 0, rest: 0 });
    if (inputFocus.current) {
      inputFocus.current.value = '';
      inputFocus.current.placeholder = 'Tempo de Foco';
    }

    if (inputRest.current) {
      inputRest.current.value = '';
      inputRest.current.placeholder = 'Descanso';
    }

    setTimerState(TimerState.PAUSED);
    focusTimer.pause();
    restTimer.pause();
  }

  async function handleSelectedMonth(date: Date) {
    // const { data } = await api.get<HabitMetrics>(
    //   `habits/${selectedHabit!._id}/metrics`,
    //   {
    //     params: {
    //       date: date.toISOString(),
    //     },
    //   },
    // );
    // setMetrics(data);
    setCurrentMonth(dayjs(date));
  }

  async function loadFocusMetrics(currentMonth: string) {
    try {
      const { data } = await api.get('focus-time/metrics', {
        params: {
          date: currentMonth,
        },
      });

      // console.log({ FOCUSMETRICS: data });
      // const [metrics] = data

      setFocusMetrics(data);
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.data.message === 'Token is invalid'
      ) {
        logout();

        navigate('/entrar');
      }
    }
  }

  async function loadFocusTimes(currentDate: string) {
    try {
      const { data } = await api.get('focus-time', {
        params: {
          date: currentDate,
        },
      });

      console.log({ FOCUSTIMES: data });
      setFocusTimes(data || []);
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.data.message === 'Token is invalid'
      ) {
        logout();

        navigate('/entrar');
      }
    }
  }

  useEffect(() => {
    loadFocusMetrics(currentMonth.toISOString());
  }, [currentMonth]);

  useEffect(() => {
    loadFocusTimes(currentDate.toISOString());
  }, [currentDate]);

  function handleSelectDay(date: Date) {
    console.log(dayjs(date).format('D [de] MMMM'));
    setCurrentDate(dayjs(date));
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Header title="Tempo de Foco" />
        <div className={styles['input-group']}>
          <div className={styles.input}>
            <Minus onClick={() => handleSubtractMinutes('focus')} />
            <input
              ref={inputFocus}
              type="text"
              placeholder="Tempo de Foco"
              disabled
            />
            <Plus onClick={() => handleAddMinutes('focus')} />
          </div>

          {/* <span style={{ color: 'white' }}>
            Teste {JSON.stringify(metricsInfoByMonth.completedDates)}
          </span> */}

          {/* <span style={{ color: 'white' }}>
            Timers (rest): {JSON.stringify(timers.rest)}
          </span> */}

          <div className={styles.input}>
            <Minus onClick={() => handleSubtractMinutes('rest')} />
            <input
              ref={inputRest}
              type="text"
              placeholder="Descanso"
              disabled
            />
            <Plus onClick={() => handleAddMinutes('rest')} />
          </div>
        </div>
        <div className={styles.timer}>
          <strong>{TimerStateDescription[timerState]}</strong>

          {timerState === TimerState.PAUSED && (
            <span>{`${String(timers.focus).padStart(2, '0')}:00`}</span>
          )}
          {timerState === TimerState.FOCUS && (
            <span>{`${String(focusTimer.minutes).padStart(2, '0')}:${String(focusTimer.seconds).padStart(2, '0')}`}</span>
          )}
          {timerState === TimerState.REST && (
            <span>{`${String(restTimer.minutes).padStart(2, '0')}:${String(restTimer.seconds).padStart(2, '0')}`}</span>
          )}
        </div>
        <div className={styles['button-group']}>
          {timerState === TimerState.PAUSED && (
            <Button
              disabled={timers.focus <= 0 || timers.rest <= 0}
              onClick={handleFocus}
            >
              Começar
            </Button>
          )}

          {timerState === TimerState.FOCUS && (
            <Button onClick={handleRest}>Iniciar Descanso</Button>
          )}

          {timerState === TimerState.REST && (
            <Button onClick={handleResume}>Retomar</Button>
          )}

          <Button variant="error" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
      <div className={styles.metrics}>
        <h2>Estatísticas</h2>

        <div className={styles['info-container']}>
          <Info
            label={String(metricsInfoByMonth.countByMonth)}
            value="Ciclos Totais no Mês"
          ></Info>
          <Info
            label={String(`${metricsInfoByDay?.totalDiff || 0} minutos`)}
            value="Tempo de Foco no Dia"
          ></Info>
        </div>
        <div className={styles['focus-time-day']}>
          <h3>{currentDate.format('D [de] MMMM')}</h3>

          {metricsInfoByDay?.timesMetrics.map((item, index) => (
            <div className={styles['focus-time-info']} key={index}>
              <div>
                <Clock />
                <span>
                  {`${item.timeFrom.format('HH:mm')} - ${item.timeTo.format('HH:mm')}`}
                </span>
              </div>
              <span>{`${item.timeTo.diff(item.timeFrom, 'minutes')} Minutos`}</span>
            </div>
          ))}
        </div>
        <div className={styles['calendar-container']}>
          <Calendar
            onMonthSelect={handleSelectedMonth}
            onPreviousMonth={handleSelectedMonth}
            onNextMonth={handleSelectedMonth}
            firstDayOfWeek={0}
            getDayProps={(date) => ({
              selected: dayjs(date).isSame(currentDate),
              onClick: () => handleSelectDay(date),
            })}
            renderDay={(date) => {
              const day = date.getDate();
              const isSame = metricsInfoByMonth.completedDates.some((item) =>
                dayjs(item.day).isSame(dayjs(date)),
              );
              return (
                <Indicator
                  size={8}
                  color="var(--info)"
                  offset={-2}
                  disabled={!isSame}
                >
                  <div>{day}</div>
                </Indicator>
              );
            }}
            locale="pt-br"
            weekdayFormat={(date) => dayjs(date).format('ddd')}
          />
        </div>
      </div>

      {/* <div className={styles.metrics}>
        <h2>Estudar Espanhol</h2>

        <div className={styles['info-container']}>
          <Info label="23" value="Ciclos Totais"></Info>
          <Info label="120min" value="Tempo total de Foco"></Info>
        </div>
        <div className={styles['calendar-container']}>
          <Calendar />
        </div>
      </div> */}
    </div>
  );
}
