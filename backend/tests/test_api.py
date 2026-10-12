import os
import sys
import unittest

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app import create_app

class CricketVerseApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["database"]["counts"]["teams"], 10)
        self.assertEqual(data["database"]["counts"]["players"], 110)

    def test_02_dashboard_summary(self):
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["total_teams"], 10)
        self.assertEqual(data["data"]["total_players"], 110)
        self.assertEqual(data["data"]["total_matches"], 74)
        self.assertEqual(data["data"]["pending_matches"], 1)

    def test_03_teams_endpoints(self):
        # List all teams
        res = self.client.get("/api/teams")
        self.assertEqual(res.status_code, 200)
        teams = res.get_json()["data"]
        self.assertEqual(len(teams), 10)

        # Team detail
        res = self.client.get("/api/teams/1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["team_code"], "CSK")

        # Team squad
        res = self.client.get("/api/teams/1/players")
        self.assertEqual(res.status_code, 200)
        players = res.get_json()["data"]
        self.assertEqual(len(players), 11)

    def test_04_players_endpoints(self):
        # Paginated players
        res = self.client.get("/api/players?page=1&limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data["data"]), 10)
        self.assertEqual(data["pagination"]["total"], 110)

        # Filter by team
        res = self.client.get("/api/players?team_code=RCB")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.get_json()["data"]), 11)

        # Player profile
        res = self.client.get("/api/players/103") # MS Dhoni
        self.assertEqual(res.status_code, 200)
        p = res.get_json()["data"]
        self.assertEqual(p["player_name"], "MS Dhoni")
        self.assertIn("boundary_runs", p["metrics"])

        # Compare players
        res = self.client.get("/api/players/compare?player1=801&player2=302")
        self.assertEqual(res.status_code, 200)
        comp = res.get_json()["data"]
        self.assertIn("leaders", comp)

    def test_05_matches_endpoints(self):
        # List matches
        res = self.client.get("/api/matches")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["pagination"]["total"], 74)

        # Pending match
        res = self.client.get("/api/matches/pending")
        self.assertEqual(res.status_code, 200)
        pending = res.get_json()["data"]
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["match_number"], 12)

    def test_06_stats_leaderboards(self):
        res = self.client.get("/api/stats/leaderboards")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertTrue(len(data["orange_cap"]) > 0)
        self.assertTrue(len(data["purple_cap"]) > 0)
        # Check Orange Cap #1 is Vaibhav Suryavanshi with 776 runs
        self.assertEqual(data["orange_cap"][0]["runs"], 776)

    def test_07_global_search(self):
        res = self.client.get("/api/search?q=Dhoni")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertTrue(any(p["player_name"] == "MS Dhoni" for p in data["players"]))

    def test_08_admin_auth_and_protection(self):
        # Unauthorized access to protected route
        res = self.client.post("/api/admin/teams", json={"team_id": 99, "team_name": "Test", "team_code": "TST"})
        self.assertEqual(res.status_code, 401)

        # Successful login
        res = self.client.post("/api/admin/login", json={"username": "admin", "password": "Admin@123"})
        self.assertEqual(res.status_code, 200)
        token = res.get_json()["token"]
        self.assertTrue(len(token) > 20)

        # Authenticated access
        res = self.client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["admin"]["username"], "admin")

    def test_09_admin_crud_workflow(self):
        # Login
        res = self.client.post("/api/admin/login", json={"username": "admin", "password": "Admin@123"})
        token = res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Add temporary player
        res = self.client.post("/api/admin/players", headers=headers, json={
            "player_id": 9999,
            "player_name": "Test Player",
            "team_id": 1
        })
        self.assertEqual(res.status_code, 201)

        # 2. Add batting stats for temporary player
        res = self.client.post("/api/admin/batting", headers=headers, json={
            "player_id": 9999,
            "runs": 150,
            "balls_faced": 100,
            "fours": 15,
            "sixes": 5,
            "batting_average": 50.0,
            "strike_rate": 150.0
        })
        self.assertEqual(res.status_code, 200)

        # 3. Add bowling stats for temporary player
        res = self.client.post("/api/admin/bowling", headers=headers, json={
            "player_id": 9999,
            "wickets": 3,
            "economy_rate": 7.5
        })
        self.assertEqual(res.status_code, 200)

        # 4. Update player
        res = self.client.put("/api/admin/players/9999", headers=headers, json={
            "player_name": "Test Player Updated",
            "team_id": 1
        })
        self.assertEqual(res.status_code, 200)

        # 5. Delete player
        res = self.client.delete("/api/admin/players/9999", headers=headers)
        self.assertEqual(res.status_code, 200)

    def test_10_foreign_key_and_validation(self):
        res = self.client.post("/api/admin/login", json={"username": "admin", "password": "Admin@123"})
        token = res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to delete team with existing players (should fail with 400)
        res = self.client.delete("/api/admin/teams/1", headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("referenced in", res.get_json()["error"])

        # Attempt to add player to nonexistent team
        res = self.client.post("/api/admin/players", headers=headers, json={
            "player_id": 8888,
            "player_name": "Invalid Team Player",
            "team_id": 99999
        })
        self.assertEqual(res.status_code, 400)

if __name__ == "__main__":
    unittest.main()
