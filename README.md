# Liquidation Radar

Liquidation Radar is a real-time DeFi monitoring dashboard built on **Somnia** that tracks borrower health factors and reacts instantly to liquidation risk using **Somnia Reactivity**.

Instead of relying on traditional polling mechanisms used in most EVM dApps, Liquidation Radar uses **event-driven subscriptions** to stream on-chain state updates directly to the application, enabling real-time risk monitoring and automated responses.

---

# Overview

DeFi lending protocols rely heavily on **health factors** to determine whether a position is safe or eligible for liquidation.

Traditional monitoring tools:

- Continuously poll RPC nodes
- Introduce latency
- Increase infrastructure costs
- Risk inconsistent state reads

Liquidation Radar solves this by leveraging **Somnia Reactivity**, which pushes **events and blockchain state atomically from the same block** directly to the application.

This enables the system to:

- Detect borrower risk instantly
- Monitor protocol-wide positions
- React immediately to market changes
- Demonstrate automated liquidation flows

---

# Core Features

## Real-Time Borrower Monitoring

Track borrower positions and health factors in real time without polling.

## Reactive Price Simulation

Simulate market changes by adjusting asset prices to observe how borrower positions react.

## Protocol Risk Dashboard

Visualize all borrowers in the system and detect liquidation risk across the protocol.

## Watched Addresses

Manually track specific wallets and monitor their positions more closely.

## Event-Driven Architecture

Powered by **Somnia Reactivity**, enabling:

- instant event notifications
- atomic state updates
- reduced RPC calls
- simplified backend architecture

## Automated Liquidation Engine

A smart contract-based liquidator reacts to borrower events and triggers liquidation when health factors fall below safe thresholds.

---

# How It Works

## 1. Borrower Positions

Users deposit collateral into the protocol and mint **RSC (Reactivity Somnia Coin)** against it.

## 2. Health Factor Calculation

Health Factor = (Collateral Value × Liquidation Threshold) / Debt

If the health factor falls below **1.0**, the position becomes liquidatable.

## 3. Price Simulation

The **Price Lab** allows controlled price changes to simulate market movements and stress test borrower positions.

## 4. Reactive Event Streams

Instead of polling:

RPC → check events → fetch state

Somnia pushes:

Event + State → Frontend

This guarantees consistent updates from the same block.

## 5. Automated Liquidation

A reactive liquidator contract listens to borrower events and automatically liquidates risky positions.

---

# Tech Stack

## Smart Contracts

- Solidity
- Foundry
- Custom lending engine
- Reactive liquidation handler

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS

## Web3

- viem
- Somnia Reactivity SDK

## Oracle

- DIA price feeds

---

# Project Structure
# LiquidationRadar
