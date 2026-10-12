-- =========================================================
-- CRICKETVERSE: COMPLETE MYSQL PROJECT DATABASE
-- =========================================================

CREATE DATABASE IF NOT EXISTS CricketVerse;
USE CricketVerse;

-- =========================================================
-- 1. TEAMS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS Teams (
    team_id INT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_code VARCHAR(10) NOT NULL UNIQUE
);

INSERT INTO Teams (team_id, team_name, team_code) VALUES
(1, 'Chennai Super Kings', 'CSK'),
(2, 'Delhi Capitals', 'DC'),
(3, 'Gujarat Titans', 'GT'),
(4, 'Kolkata Knight Riders', 'KKR'),
(5, 'Lucknow Super Giants', 'LSG'),
(6, 'Mumbai Indians', 'MI'),
(7, 'Punjab Kings', 'PBKS'),
(8, 'Rajasthan Royals', 'RR'),
(9, 'Royal Challengers Bengaluru', 'RCB'),
(10, 'Sunrisers Hyderabad', 'SRH')
ON DUPLICATE KEY UPDATE team_name=VALUES(team_name), team_code=VALUES(team_code);

-- =========================================================
-- 2. PLAYERS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS Players (
    player_id INT PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_id INT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE
);

INSERT INTO Players (player_id, player_name, team_id) VALUES
-- CSK
(101, 'Sanju Samson', 1),
(102, 'Ruturaj Gaikwad', 1),
(103, 'MS Dhoni', 1),
(104, 'Shivam Dube', 1),
(105, 'Urvil Patel', 1),
(106, 'Jamie Overton', 1),
(107, 'Anshul Kamboj', 1),
(108, 'Noor Ahmad', 1),
(109, 'Mukesh Choudhary', 1),
(110, 'Ayush Mhatre', 1),
(111, 'Nathan Ellis', 1),

-- DC
(201, 'Axar Patel', 2),
(202, 'Abhishek Porel', 2),
(203, 'KL Rahul', 2),
(204, 'Tristan Stubbs', 2),
(205, 'Ashutosh Sharma', 2),
(206, 'Madhav Tiwari', 2),
(207, 'Mitchell Starc', 2),
(208, 'Kuldeep Yadav', 2),
(209, 'Mukesh Kumar', 2),
(210, 'T Natarajan', 2),
(211, 'Vipraj Nigam', 2),

-- GT
(301, 'Sai Sudharsan', 3),
(302, 'Shubman Gill', 3),
(303, 'Jos Buttler', 3),
(304, 'Washington Sundar', 3),
(305, 'Rashid Khan', 3),
(306, 'Mohd. Arshad Khan', 3),
(307, 'Nishant Sindhu', 3),
(308, 'Kagiso Rabada', 3),
(309, 'Mohammad Siraj', 3),
(310, 'Shahrukh Khan', 3),
(311, 'Rahul Tewatia', 3),

-- KKR
(401, 'Finn Allen', 4),
(402, 'Ajinkya Rahane', 4),
(403, 'Angkrish Raghuvanshi', 4),
(404, 'Rinku Singh', 4),
(405, 'Sunil Narine', 4),
(406, 'Varun Chakravarthy', 4),
(407, 'Harshit Rana', 4),
(408, 'Anukul Roy', 4),
(409, 'Manish Pandey', 4),
(410, 'Ramandeep Singh', 4),
(411, 'Vaibhav Arora', 4),

-- LSG
(501, 'Mitchell Marsh', 5),
(502, 'Nicholas Pooran', 5),
(503, 'Rishabh Pant', 5),
(504, 'Aiden Markram', 5),
(505, 'Shahbaz Ahmed', 5),
(506, 'Prince Yadav', 5),
(507, 'Mohammed Shami', 5),
(508, 'Ayush Badoni', 5),
(509, 'Abdul Samad', 5),
(510, 'Avesh Khan', 5),
(511, 'Mayank Yadav', 5),

-- MI
(601, 'Rohit Sharma', 6),
(602, 'Ryan Rickelton', 6),
(603, 'Suryakumar Yadav', 6),
(604, 'Tilak Varma', 6),
(605, 'Naman Dhir', 6),
(606, 'Hardik Pandya', 6),
(607, 'Raj Bawa', 6),
(608, 'Jasprit Bumrah', 6),
(609, 'Trent Boult', 6),
(610, 'Deepak Chahar', 6),
(611, 'Shardul Thakur', 6),

-- PBKS
(701, 'Prabhsimran Singh', 7),
(702, 'Priyansh Arya', 7),
(703, 'Shreyas Iyer', 7),
(704, 'Shashank Singh', 7),
(705, 'Marcus Stoinis', 7),
(706, 'Marco Jansen', 7),
(707, 'Lockie Ferguson', 7),
(708, 'Arshdeep Singh', 7),
(709, 'Yuzvendra Chahal', 7),
(710, 'Nehal Wadhera', 7),
(711, 'Harpreet Brar', 7),

-- RR
(801, 'Vaibhav Suryavanshi', 8),
(802, 'Yashasvi Jaiswal', 8),
(803, 'Dhruv Jurel', 8),
(804, 'Riyan Parag', 8),
(805, 'Donovan Ferreira', 8),
(806, 'Ravindra Jadeja', 8),
(807, 'Jofra Archer', 8),
(808, 'Nandre Burger', 8),
(809, 'Shimron Hetmyer', 8),
(810, 'Sandeep Sharma', 8),
(811, 'Tushar Deshpande', 8),

-- RCB
(901, 'Jacob Bethell', 9),
(902, 'Virat Kohli', 9),
(903, 'Devdutt Padikkal', 9),
(904, 'Rajat Patidar', 9),
(905, 'Jitesh Sharma', 9),
(906, 'Tim David', 9),
(907, 'Krunal Pandya', 9),
(908, 'Bhuvneshwar Kumar', 9),
(909, 'Josh Hazlewood', 9),
(910, 'Phil Salt', 9),
(911, 'Suyash Sharma', 9),

-- SRH
(1001, 'Abhishek Sharma', 10),
(1002, 'Travis Head', 10),
(1003, 'Ishan Kishan', 10),
(1004, 'Heinrich Klaasen', 10),
(1005, 'Nitish Kumar Reddy', 10),
(1006, 'Pat Cummins', 10),
(1007, 'Harshal Patel', 10),
(1008, 'Mohammed Shami', 10),
(1009, 'Eshan Malinga', 10),
(1010, 'Harsh Dubey', 10),
(1011, 'Aniket Verma', 10)
ON DUPLICATE KEY UPDATE player_name=VALUES(player_name), team_id=VALUES(team_id);

-- =========================================================
-- 3. MATCHES TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS Matches (
    match_number INT PRIMARY KEY,
    match_date DATE NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    venue VARCHAR(150),
    winner_id INT NULL,
    FOREIGN KEY (team1_id) REFERENCES Teams(team_id),
    FOREIGN KEY (team2_id) REFERENCES Teams(team_id),
    FOREIGN KEY (winner_id) REFERENCES Teams(team_id)
);

INSERT INTO Matches
(match_number, match_date, team1_id, team2_id, venue, winner_id)
VALUES
(1, '2026-03-28', 9, 10, 'M. Chinnaswamy Stadium, Bengaluru', 9),
(2, '2026-03-29', 6, 4, 'Wankhede Stadium, Mumbai', 6),
(3, '2026-03-30', 8, 1, 'Barsapara Cricket Stadium, Guwahati', 8),
(4, '2026-03-31', 7, 3, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 7),
(5, '2026-04-01', 5, 2, 'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow', 2),
(6, '2026-04-02', 4, 10, 'Eden Gardens, Kolkata', 10),
(7, '2026-04-03', 1, 7, 'MA Chidambaram Stadium, Chennai', 7),
(8, '2026-04-04', 2, 6, 'Arun Jaitley Stadium, New Delhi', 2),
(9, '2026-04-04', 3, 8, 'Narendra Modi Stadium, Ahmedabad', 8),
(10, '2026-04-05', 10, 5, 'Rajiv Gandhi International Stadium, Hyderabad', 5),
(11, '2026-04-05', 9, 1, 'M. Chinnaswamy Stadium, Bengaluru', 9),
(12, '2026-04-06', 4, 7, 'Eden Gardens, Kolkata', NULL),
(13, '2026-04-07', 8, 6, 'Barsapara Cricket Stadium, Guwahati', 8),
(14, '2026-04-08', 2, 3, 'Arun Jaitley Stadium, New Delhi', 3),
(15, '2026-04-09', 4, 5, 'Eden Gardens, Kolkata', 5),
(16, '2026-04-10', 8, 9, 'Barsapara Cricket Stadium, Guwahati', 8),
(17, '2026-04-11', 7, 10, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 7),
(18, '2026-04-11', 1, 2, 'MA Chidambaram Stadium, Chennai', 1),
(19, '2026-04-12', 5, 3, 'Ekana Cricket Stadium, Lucknow', 3),
(20, '2026-04-12', 6, 9, 'Wankhede Stadium, Mumbai', 9),
(21, '2026-04-13', 10, 8, 'Rajiv Gandhi International Stadium, Hyderabad', 10),
(22, '2026-04-14', 1, 4, 'MA Chidambaram Stadium, Chennai', 1),
(23, '2026-04-15', 9, 5, 'M. Chinnaswamy Stadium, Bengaluru', 9),
(24, '2026-04-16', 6, 7, 'Wankhede Stadium, Mumbai', 7),
(25, '2026-04-17', 3, 4, 'Narendra Modi Stadium, Ahmedabad', 3),
(26, '2026-04-18', 9, 2, 'M. Chinnaswamy Stadium, Bengaluru', 2),
(27, '2026-04-18', 10, 1, 'Rajiv Gandhi International Stadium, Hyderabad', 10),
(28, '2026-04-19', 4, 8, 'Eden Gardens, Kolkata', 4),
(29, '2026-04-19', 7, 5, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 7),
(30, '2026-04-20', 3, 6, 'Narendra Modi Stadium, Ahmedabad', 6),
(31, '2026-04-21', 10, 2, 'Rajiv Gandhi International Stadium, Hyderabad', 10),
(32, '2026-04-22', 5, 8, 'Ekana Cricket Stadium, Lucknow', 8),
(33, '2026-04-23', 6, 1, 'Wankhede Stadium, Mumbai', 1),
(34, '2026-04-24', 9, 3, 'M. Chinnaswamy Stadium, Bengaluru', 9),
(35, '2026-04-25', 2, 7, 'Arun Jaitley Stadium, New Delhi', 7),
(36, '2026-04-25', 8, 10, 'Sawai Mansingh Stadium, Jaipur', 10),
(37, '2026-04-26', 1, 3, 'MA Chidambaram Stadium, Chennai', 3),
(38, '2026-04-26', 5, 4, 'Ekana Cricket Stadium, Lucknow', 4),
(39, '2026-04-27', 2, 9, 'Arun Jaitley Stadium, New Delhi', 9),
(40, '2026-04-28', 7, 8, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 8),
(41, '2026-04-29', 6, 10, 'Wankhede Stadium, Mumbai', 10),
(42, '2026-04-30', 3, 9, 'Narendra Modi Stadium, Ahmedabad', 3),
(43, '2026-05-01', 8, 2, 'Sawai Mansingh Stadium, Jaipur', 2),
(44, '2026-05-02', 1, 6, 'MA Chidambaram Stadium, Chennai', 1),
(45, '2026-05-03', 10, 4, 'Rajiv Gandhi International Stadium, Hyderabad', 4),
(46, '2026-05-03', 3, 7, 'Narendra Modi Stadium, Ahmedabad', 3),
(47, '2026-05-04', 6, 5, 'Wankhede Stadium, Mumbai', 6),
(48, '2026-05-05', 2, 1, 'Arun Jaitley Stadium, New Delhi', 1),
(49, '2026-05-06', 10, 7, 'Rajiv Gandhi International Stadium, Hyderabad', 10),
(50, '2026-05-07', 5, 9, 'Ekana Cricket Stadium, Lucknow', 5),
(51, '2026-05-08', 2, 4, 'Arun Jaitley Stadium, New Delhi', 4),
(52, '2026-05-09', 8, 3, 'Sawai Mansingh Stadium, Jaipur', 3),
(53, '2026-05-10', 1, 5, 'MA Chidambaram Stadium, Chennai', 1),
(54, '2026-05-10', 9, 6, 'Shaheed Veer Narayan Singh International Stadium, Raipur', 9),
(55, '2026-05-11', 7, 2, 'Himachal Pradesh Cricket Association Stadium, Dharamshala', 2),
(56, '2026-05-12', 3, 10, 'Narendra Modi Stadium, Ahmedabad', 3),
(57, '2026-05-13', 9, 4, 'Shaheed Veer Narayan Singh International Stadium, Raipur', 9),
(58, '2026-05-14', 7, 6, 'Himachal Pradesh Cricket Association Stadium, Dharamshala', 6),
(59, '2026-05-15', 5, 1, 'Ekana Cricket Stadium, Lucknow', 5),
(60, '2026-05-16', 4, 3, 'Eden Gardens, Kolkata', 4),
(61, '2026-05-17', 7, 9, 'Himachal Pradesh Cricket Association Stadium, Dharamshala', 9),
(62, '2026-05-17', 2, 8, 'Arun Jaitley Stadium, New Delhi', 2),
(63, '2026-05-18', 1, 10, 'MA Chidambaram Stadium, Chennai', 10),
(64, '2026-05-19', 5, 8, 'Sawai Mansingh Stadium, Jaipur', 8),
(65, '2026-05-20', 4, 6, 'Eden Gardens, Kolkata', 4),
(66, '2026-05-21', 3, 1, 'Narendra Modi Stadium, Ahmedabad', 3),
(67, '2026-05-22', 10, 9, 'Rajiv Gandhi International Stadium, Hyderabad', 10),
(68, '2026-05-23', 5, 7, 'Ekana Cricket Stadium, Lucknow', 7),
(69, '2026-05-24', 6, 8, 'Wankhede Stadium, Mumbai', 8),
(70, '2026-05-24', 4, 2, 'Eden Gardens, Kolkata', 2),
(71, '2026-05-26', 9, 3, 'Himachal Pradesh Cricket Association Stadium, Dharamshala', 9),
(72, '2026-05-27', 10, 8, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 8),
(73, '2026-05-29', 3, 8, 'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh', 3),
(74, '2026-05-31', 9, 3, 'Narendra Modi Stadium, Ahmedabad', 9)
ON DUPLICATE KEY UPDATE match_date=VALUES(match_date), team1_id=VALUES(team1_id), team2_id=VALUES(team2_id), venue=VALUES(venue), winner_id=VALUES(winner_id);

-- =========================================================
-- 4. BATTING SEASON TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS BattingSeason (
    player_id INT PRIMARY KEY,
    runs INT NOT NULL DEFAULT 0,
    balls_faced INT NOT NULL,
    fours INT NOT NULL,
    sixes INT NOT NULL,
    batting_average DECIMAL(6,2),
    strike_rate DECIMAL(6,2),
    FOREIGN KEY (player_id) REFERENCES Players(player_id) ON DELETE CASCADE
);

INSERT INTO BattingSeason
(player_id, runs, balls_faced, fours, sixes, batting_average, strike_rate)
VALUES
(101,477,302,53,24,39.75,157.95),
(102,350,260,38,15,31.82,134.62),
(103,120,105,10,4,20.00,114.29),
(104,280,170,22,18,35.00,164.71),
(105,190,125,18,9,23.75,152.00),
(106,85,65,6,4,17.00,130.77),
(107,45,38,3,2,11.25,118.42),
(108,30,28,2,1,10.00,107.14),
(109,20,18,1,1,10.00,111.11),
(110,240,155,25,10,30.00,154.84),
(111,15,14,1,0,7.50,107.14),

(201,593,340,56,31,45.62,174.41),
(202,210,170,22,8,23.33,123.53),
(203,320,230,35,12,32.00,139.13),
(204,280,180,24,14,35.00,155.56),
(205,180,135,15,7,25.71,133.33),
(206,95,70,8,4,19.00,135.71),
(207,40,35,3,2,13.33,114.29),
(208,25,22,2,0,12.50,113.64),
(209,15,12,1,1,7.50,125.00),
(210,10,9,1,0,5.00,111.11),
(211,65,45,5,3,16.25,144.44),

(301,722,457,75,30,45.13,157.98),
(302,732,449,74,33,45.75,163.02),
(303,526,345,51,26,37.57,152.46),
(304,210,145,20,8,30.00,144.83),
(305,90,70,7,4,18.00,128.57),
(306,75,55,6,3,15.00,136.36),
(307,120,95,10,4,20.00,126.32),
(308,35,30,2,2,11.67,116.67),
(309,55,40,5,2,18.33,137.50),
(310,150,105,12,7,25.00,142.86),
(311,100,75,8,4,20.00,133.33),

(401,180,150,18,4,22.50,120.00),
(402,240,175,25,9,30.00,137.14),
(403,290,195,32,12,32.22,148.72),
(404,310,205,24,20,34.44,151.22),
(405,200,140,18,9,25.00,142.86),
(406,150,95,12,10,25.00,157.89),
(407,90,65,7,4,18.00,138.46),
(408,130,100,12,5,21.67,130.00),
(409,110,85,9,4,22.00,129.41),
(410,75,50,5,3,15.00,150.00),
(411,25,20,2,1,12.50,125.00),

(501,563,345,51,36,43.31,163.18),
(502,290,205,28,13,32.22,141.46),
(503,340,220,30,21,37.78,154.55),
(504,310,225,34,10,31.00,137.78),
(505,180,125,15,9,25.71,144.00),
(506,240,165,22,10,30.00,145.45),
(507,95,70,7,5,19.00,135.71),
(508,80,60,6,3,16.00,133.33),
(509,140,95,10,9,23.33,147.37),
(510,20,18,1,1,10.00,111.11),
(511,35,30,2,2,11.67,116.67),

(601,390,270,42,18,35.45,144.44),
(602,310,195,34,15,34.44,158.97),
(603,420,260,40,24,38.18,161.54),
(604,380,250,35,20,38.00,152.00),
(605,160,110,14,7,26.67,145.45),
(606,250,165,20,14,31.25,151.52),
(607,45,35,4,1,11.25,128.57),
(608,70,55,5,3,14.00,127.27),
(609,30,25,2,1,10.00,120.00),
(610,25,20,2,1,12.50,125.00),
(611,60,45,5,2,15.00,133.33),

(701,510,302,55,23,42.50,168.87),
(702,260,165,27,14,28.89,157.58),
(703,498,295,39,30,55.33,168.81),
(704,220,145,20,12,31.43,151.72),
(705,190,135,16,10,23.75,140.74),
(706,175,120,14,11,29.17,145.83),
(707,280,175,24,16,35.00,160.00),
(708,55,40,4,3,13.75,137.50),
(709,25,20,2,1,8.33,125.00),
(710,210,150,20,9,30.00,140.00),
(711,40,35,3,1,13.33,114.29),

(801,776,327,63,72,48.50,237.30),
(802,427,260,45,20,30.50,164.23),
(803,515,333,47,24,36.79,154.65),
(804,310,220,28,13,31.00,140.91),
(805,180,115,14,11,30.00,156.52),
(806,220,160,20,8,27.50,137.50),
(807,90,65,7,4,18.00,138.46),
(808,45,35,3,2,11.25,128.57),
(809,250,160,20,15,31.25,156.25),
(810,25,22,2,0,8.33,113.64),
(811,15,12,1,0,7.50,125.00),

(901,35,28,3,1,17.50,125.00),
(902,675,407,73,25,56.25,165.84),
(903,464,290,48,21,35.69,160.00),
(904,501,260,30,42,41.75,192.69),
(905,240,145,18,17,30.00,165.52),
(906,190,115,14,13,27.14,165.22),
(907,170,120,15,7,28.33,141.67),
(908,55,40,5,2,18.33,137.50),
(909,30,25,2,1,10.00,120.00),
(910,310,190,32,18,34.44,163.16),
(911,20,18,1,1,10.00,111.11),

(1001,563,275,50,43,40.21,204.72),
(1002,410,260,42,24,34.17,157.69),
(1003,602,330,60,32,40.13,182.42),
(1004,624,390,48,31,48.00,160.00),
(1005,290,195,28,14,32.22,148.72),
(1006,60,45,4,3,15.00,133.33),
(1007,35,28,2,1,11.67,125.00),
(1008,25,20,2,0,8.33,125.00),
(1009,15,12,1,0,7.50,125.00),
(1010,40,32,3,1,10.00,125.00),
(1011,120,85,10,5,24.00,141.18)
ON DUPLICATE KEY UPDATE runs=VALUES(runs), balls_faced=VALUES(balls_faced), fours=VALUES(fours), sixes=VALUES(sixes), batting_average=VALUES(batting_average), strike_rate=VALUES(strike_rate);

-- =========================================================
-- 5. BOWLING SEASON TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS BowlingSeason (
    player_id INT PRIMARY KEY,
    wickets INT NOT NULL,
    economy_rate DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (player_id) REFERENCES Players(player_id) ON DELETE CASCADE
);

INSERT INTO BowlingSeason (player_id, wickets, economy_rate) VALUES
(106,9,9.15),
(107,21,10.53),
(108,13,8.39),
(109,5,9.75),
(111,7,9.20),

(201,11,8.18),
(207,8,9.60),
(208,12,8.85),
(209,7,9.30),
(210,6,9.80),
(211,5,8.95),

(305,21,9.08),
(306,4,10.20),
(307,3,9.75),
(308,29,9.68),
(309,19,9.06),
(311,5,8.90),

(405,15,6.65),
(406,12,8.90),
(407,10,9.45),
(408,4,8.75),
(411,8,9.65),

(505,5,9.10),
(506,16,8.83),
(510,7,10.10),
(511,6,9.25),

(606,4,11.42),
(607,5,9.80),
(608,4,8.37),
(609,2,11.62),
(610,8,10.39),
(611,12,12.27),

(705,6,9.45),
(706,8,9.20),
(707,9,9.75),
(708,13,8.95),
(709,10,8.70),
(711,4,8.60),

(806,10,8.39),
(807,25,9.32),
(808,8,9.55),
(810,7,8.95),
(811,5,9.70),

(907,14,8.42),
(908,28,7.95),
(909,15,9.59),
(911,5,9.25),

(1006,8,9.20),
(1007,9,9.55),
(1008,6,9.80),
(1009,20,9.33),
(1010,5,9.10)
ON DUPLICATE KEY UPDATE wickets=VALUES(wickets), economy_rate=VALUES(economy_rate);

-- =========================================================
-- 6. ADMIN AUTHENTICATION TABLE (Security requirement 4.H)
-- =========================================================

CREATE TABLE IF NOT EXISTS AdminUsers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
