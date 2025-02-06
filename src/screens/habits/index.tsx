import { Indicator } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { PaperPlaneRight, Trash } from '@phosphor-icons/react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from '../../components/header';
import { Info } from '../../components/info';
import { useUser } from '../../hooks/use-user';
import { api, isAxiosError } from '../../services/api';
import styles from './styles.module.css';

type Habit = {
  name: string;
  _id: string;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

type HabitMetrics = {
  _id: string;
  name: string;
  completedDates: string[];
};

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const inputName = useRef<HTMLInputElement>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [metrics, setMetrics] = useState<HabitMetrics>({} as HabitMetrics);
  const today = dayjs().startOf('day');
  const { logout } = useUser();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(today.toDate()); // TERMINAR ISSO AQUI AINDA

  const metricsInfo = useMemo(() => {
    const numberOfMonthDays = today.endOf('month').get('date');
    const numberOfDays = metrics?.completedDates
      ? metrics.completedDates.length
      : 0;

    const completedDatesPerMonth = `${numberOfDays} / ${numberOfMonthDays}`;
    const completedMonthPercentage = `${Math.round((numberOfDays / numberOfMonthDays) * 100)}%`;

    return {
      completedDatesPerMonth,
      completedMonthPercentage,
    };
  }, [metrics]);

  async function handleSelectedHabit(habit: Habit) {
    if (selectedHabit?._id === habit._id) {
      setSelectedHabit(null);
      return;
    }

    setSelectedHabit(habit);

    const { data } = await api.get<HabitMetrics>(
      `habits/${habit._id}/metrics`,
      {
        params: {
          date: currentMonth.toISOString(),
        },
      },
    );
    setMetrics(data);
  }

  async function handleSelectedMonth(date: Date) {
    const { data } = await api.get<HabitMetrics>(
      `habits/${selectedHabit!._id}/metrics`,
      {
        params: {
          date: date.toISOString(),
        },
      },
    );
    setMetrics(data);
    setCurrentMonth(date);
  }

  async function loadHabits() {
    try {
      const { data } = await api.get<Habit[]>('habits');
      setHabits(data);
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

  async function handleSubmit() {
    const name = inputName.current?.value;

    if (name) {
      await api.post('habits', { name });
      inputName.current.value = '';
    }
    loadHabits();
  }

  async function handleToggle(habit: Habit) {
    await api.patch(`habits/${habit._id}/toggle`);
    loadHabits();

    if (habit._id === selectedHabit?._id) {
      const { data } = await api.get<HabitMetrics>(
        `habits/${habit._id}/metrics`,
        {
          params: {
            date: today.toISOString(),
          },
        },
      );
      setMetrics(data);
    }
  }

  async function handleRemove(habit: Habit) {
    await api.delete(`habits/${habit._id}`);
    loadHabits();

    if (habit._id === selectedHabit?._id) {
      setSelectedHabit(null);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Header title="Hábitos Diários" />
        <div className={styles.input}>
          <input
            ref={inputName}
            type="text"
            placeholder="Digite aqui um novo hábito"
          />
          <PaperPlaneRight onClick={handleSubmit} />
        </div>
        <div className={styles.habits}>
          {habits.map((item) => (
            <div
              key={item._id}
              className={clsx(
                styles.habit,
                selectedHabit?._id === item._id && styles['habit-selected'],
              )}
              onClick={() => handleSelectedHabit(item)}
            >
              <p>{item.name}</p>
              <div>
                <input
                  type="checkbox"
                  name=""
                  id=""
                  checked={item.completedDates.some(
                    (date) => date === today.toISOString(),
                  )}
                  onClick={(e) => e.stopPropagation()} // Impede propagação
                  onChange={() => handleToggle(item)}
                  // TENHO QUE ARRUMAR O CURRENT DATA AQUI, QUANDO ESTOU COM UM HABITO SELECIONADO E DOU O TOGGLE, SE EU TIVER EM OUTRO MES TIPO NOVEMBRO, QUE O HABITO TENHA ALGUMA DATA COMPLETADA, ELE NAO VAI RECEBER MAIS ESSE DADO, APENAS DO MEU ATUAL, ARRUMAR ISSO
                />
                <Trash
                  onClick={(e) => {
                    e.stopPropagation(); // Impede propagação
                    handleRemove(item);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedHabit && (
        <div className={styles.metrics}>
          <h2>{selectedHabit.name}</h2>

          <div className={styles['info-container']}>
            <Info
              label={metricsInfo.completedDatesPerMonth}
              value="Dias Concluídos"
            ></Info>
            <Info
              label={metricsInfo.completedMonthPercentage}
              value="Porcentagem"
            ></Info>
          </div>
          <div className={styles['calendar-container']}>
            <Calendar
              onMonthSelect={(date) => handleSelectedMonth(date)}
              onPreviousMonth={(date) => handleSelectedMonth(date)}
              onNextMonth={(date) => handleSelectedMonth(date)}
              firstDayOfWeek={0}
              static
              renderDay={(date) => {
                const day = date.getDate();
                const isSame = metrics?.completedDates?.some((item) =>
                  dayjs(item).isSame(dayjs(date)),
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
