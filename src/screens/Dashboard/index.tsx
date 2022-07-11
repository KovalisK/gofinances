import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { HighligthCard } from '../../components/HighligthCard'
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import {
    Container,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    Icon,
    HighligthCards,
    Transactions,
    Title,
    TransactionList,
    LoadContainer,
    LogoutButton
} from './styles';

export interface DataListProps extends TransactionCardProps {
    id: string;
}

interface HighligthProps {
    amount: string;
    lastTransaction: string;
}

interface HighligthData {
    entries: HighligthProps;
    expensives: HighligthProps;
    total: HighligthProps;
}

export function Dashboard (){
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    const [highligthData, setHighligthData] = useState<HighligthData>({} as HighligthData);

    const theme = useTheme();
    const { signOut, user } = useAuth();

    function getLastTransactionDate(
        collection: DataListProps[],
        type: 'positive' | 'negative'
    ) {
        const collectionFilttered = collection
            .filter(transaction => transaction.type === type);

        if(collectionFilttered.length === 0)
            return 0;

        const lastTransaction = new Date(
        Math.max.apply(Math, collectionFilttered
            .map(transaction => new Date (transaction.date).getTime())));
    
            return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', {month: 'long'})}`;
    }

    async function loadTransactions() {
        const dataKey = `@gofinance:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const transactions = response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0;

        const transactionsFormatted: DataListProps[] = transactions
        .map((item: DataListProps) => {
            if (item.type === 'positive') {
                entriesTotal += Number(item.amount);
            } else {
                expensiveTotal += Number(item.amount); 
            }

            const amount = Number(item.amount)
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const date = Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(new Date(item.date));

            return {
                id: item.id,
                name: item.name,
                amount,
                type: item.type,
                category: item.category,
                date,
            }
        });

        setTransactions(transactionsFormatted);

        const lastTransactionEntries =  getLastTransactionDate(transactions, 'positive');
        const lastTransactionExpensives =  getLastTransactionDate(transactions, 'negative');

        const totalInterval = lastTransactionExpensives === 0
            ? 'Não hà transações'
            : `01 à ${lastTransactionExpensives}`;

        const total = entriesTotal - expensiveTotal;

        setHighligthData({
            entries: {
                amount: entriesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionEntries === 0
                ? 'Não hà transações'
                : `Última entrada dia ${lastTransactionEntries}`,
            },
            expensives: {
                amount: expensiveTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionExpensives === 0
                ? 'Não hà transações'
                : `Última entrada dia ${lastTransactionExpensives}`,
            },
            total: {
                amount: total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: totalInterval,
            },
        });

        setIsLoading(false);
    }

    useEffect(() => {
        loadTransactions();
    }, []);

    useFocusEffect(useCallback(() => {
        loadTransactions();
    }, []));

    return (
        <Container>
            {
                isLoading ? 
                <LoadContainer>
                    <ActivityIndicator
                        color={theme.colors.primary}
                        size='large'
                    />
                </LoadContainer> :
                <>
                    <Header>
                        <UserWrapper>
                            <UserInfo>
                                <Photo 
                                    source={{ uri: user.photo }}
                                />
                                <User>
                                    <UserGreeting>Olá,</UserGreeting>
                                    <UserName>{user.name}</UserName>
                                </User>
                            </UserInfo>

                            <LogoutButton onPress={signOut}>
                                <Icon name='power' />
                            </LogoutButton>
                        </UserWrapper>
                    </Header>

                    <HighligthCards>
                        <HighligthCard
                            type='up'
                            title='Entradas' 
                            amount={highligthData.entries.amount}
                            lastTransaction={highligthData.entries.lastTransaction}
                        />
                        <HighligthCard
                            type='down'
                            title='Saídas' 
                            amount={highligthData.expensives.amount}
                            lastTransaction={highligthData.expensives.lastTransaction}
                        />
                        <HighligthCard
                            type='total'
                            title='Total'
                            amount={highligthData.total.amount}
                            lastTransaction={highligthData.total.lastTransaction}
                        />
                    </HighligthCards>

                    <Transactions>
                        <Title>Listagem</Title>

                        <TransactionList 
                            data={transactions}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <TransactionCard data={item} />}
                        />
                    </Transactions>
                </>
            }
        </Container>
    )
}