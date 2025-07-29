# Game API Documentation (API.md)

This document outlines the API contract for all gameplay-related features, including creating and managing game rooms, handling players, and submitting guesses.

---

### Authentication

All endpoints listed below require authentication. The client must send an `Authorization` header with a Bearer Token.

**Header Format:**
`Authorization: Bearer <YOUR_JWT_TOKEN>`

---

## 1. Rooms API

Base Path: `/api/rooms`

### 1.1 Create Room

Creates a new game room for either single-player or multiplayer mode. The backend is responsible for creating the room and all 5 of its associated rounds with unique, curated locations.

- **Endpoint:** `POST /api/rooms`
- **Description:** Creates a new game session.
- **Request Body:**
  ```json
  {
    "mode": "single" | "multi",
    "difficulty": "classic" | "challenge",
    "hostId": "string",
    "maxPlayers": "number"
  }
  ```
- **Success Response (201 Created):**
  Returns the complete room object, including the array of 5 rounds and their locations.
  ```json
  {
    "id": "room_cuid_123",
    "mode": "single",
    "difficulty": "classic",
    "status": "playing",
    "maxPlayers": 1,
    "hostId": "user_cuid_abc",
    "players": [
      { "userId": "user_cuid_abc", "isHost": true, ... }
    ],
    "rounds": [
      { "id": "round_cuid_r1", "roundNumber": 1, "location": { "lat": 13.7569, "lng": 100.5025, ... } },
      { "id": "round_cuid_r2", "roundNumber": 2, "location": { ... } },
      { "id": "round_cuid_r3", "roundNumber": 3, "location": { ... } },
      { "id": "round_cuid_r4", "roundNumber": 4, "location": { ... } },
      { "id": "round_cuid_r5", "roundNumber": 5, "location": { ... } }
    ]
  }
  ```

### 1.2 Get Room Details

Fetches the current state of a specific room, including all players.

- **Endpoint:** `GET /api/rooms/:roomId`
- **Description:** Retrieves all data for a specific room, used for loading the lobby.
- **Success Response (200 OK):**
  Returns the complete room object, similar to the "Create Room" response.

### 1.3 Join Room

Allows a player to join an existing multiplayer room.

- **Endpoint:** `POST /api/rooms/:roomId/join`
- **Description:** Adds the authenticated user to the specified room.
- **Request Body:**
  ```json
  {
    "userId": "string"
  }
  ```
- **Success Response (200 OK):**
  Returns the updated room object with the new player in the `players` array.

### 1.4 Start Game

Allows the host to start a multiplayer game from the lobby.

- **Endpoint:** `POST /api/rooms/:roomId/start`
- **Description:** Changes the room's status from `waiting` to `playing`. This should trigger a real-time event (e.g., via WebSockets) to all clients in the lobby to navigate them to the gameplay screen.
- **Success Response (200 OK):**
  ```json
  {
    "message": "Game started successfully."
  }
  ```

### 1.5 Get Game Results

Fetches the final results of a completed game, including the scores of all players.

- **Endpoint:** `GET /api/rooms/:roomId/results`
- **Description:** Retrieves the final scores for a completed game. This is called when navigating to the final "Game Over" screen.
- **Success Response (200 OK):**
  Returns an object with the final player scores, ordered by rank, including a breakdown of scores for each round.
  ```json
  {
    "roomId": "room_cuid_123",
    "status": "finished",
    "results": [
      {
        "userId": "user_cuid_xyz",
        "username": "PlayerTwo",
        "totalScore": 22500,
        "rank": 1,
        "roundScores": [
          { "roundNumber": 1, "score": 4500 },
          { "roundNumber": 2, "score": 4800 },
          { "roundNumber": 3, "score": 3200 },
          { "roundNumber": 4, "score": 5000 },
          { "roundNumber": 5, "score": 5000 }
        ]
      },
      {
        "userId": "user_cuid_abc",
        "username": "PlayerOne",
        "totalScore": 18750,
        "rank": 2,
        "roundScores": [
          { "roundNumber": 1, "score": 3750 },
          { "roundNumber": 2, "score": 4000 },
          { "roundNumber": 3, "score": 3000 },
          { "roundNumber": 4, "score": 4000 },
          { "roundNumber": 5, "score": 4000 }
        ]
      }
    ]
  }
  ```

---

## 2. Guesses API

Base Path: `/api/guesses`

### 2.1 Submit Guess

Submits a player's guess for the current round.

- **Endpoint:** `POST /api/guesses`
- **Description:** The backend will create a `Guess` record, calculate the distance and score, and update the `RoomPlayer`'s `totalScore`. If this is the final guess of a multiplayer game, the backend will also calculate win rates.
- **Request Body:**
  ```json
  {
    "roundId": "string",
    "userId": "string",
    "guess": {
      "lat": 14.0428,
      "lng": 99.5037
    }
  }
  ```
  _Note: `guess` can be `null` if the player runs out of time._
- **Success Response (201 Created):**
  Returns the newly created `Guess` object.
  ```json
  {
    "id": "guess_cuid_xyz",
    "roundId": "round_cuid_r1",
    "userId": "user_cuid_abc",
    "guessedLat": 14.0428,
    "guessedLng": 99.5037,
    "distance": 150.5,
    "score": 4500
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "message": "Round has already been guessed by this user."
  }
  ```
