┌─────────────┐     HTTP Request     ┌─────────────┐     HTTP Request     ┌───────────────┐
│             │ ------------------>  │             │ ------------------>  │               │
│  React      │                      │  Express    │                      │  Codeforces/  │
│  Frontend   │                      │  Backend    │                      │  LeetCode API │
│             │ <------------------  │             │ <------------------  │               │
└─────────────┘     JSON Response    └─────────────┘     JSON Response    └───────────────┘
                                          │  ▲
                                          │  │
                                          ▼  │
                                     ┌─────────────┐
                                     │             │
                                     │   Redis     │
                                     │   Cache     │
                                     │             │
                                     └─────────────┘