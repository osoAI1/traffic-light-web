from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import time
from datetime import datetime
import logging
from threading import Thread, Lock
from collections import deque
import statistics

app = Flask(__name__)
CORS(app)

# =========================
# Logging
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# =========================
# Traffic Controller
# =========================
class TrafficController:
    def __init__(self):
        self.lock = Lock()

        # FSM
        self.state = "CAR_GREEN"
        self.timer = 0

        # Pedestrian
        self.pedestrian_request = False
        self.request_count = 0

        # Timing
        self.MIN_GREEN = 10
        self.YELLOW_TIME = 3
        self.WALK_TIME = 7

        # Suspension
        self.suspended = False
        self.suspend_end_time = None
        self.suspended_state = None

        # Statistics
        self.cycle_count = 0
        self.state_change_count = 0
        self.system_start_time = time.time()
        self.cycle_times = []

        self.stats = {
            "total_requests": 0,
            "cycles_completed": 0,
            "avg_wait_time": 0,
            "avg_cycle_time": 0,
            "system_uptime": 0
        }

        # History
        self.state_history = deque(maxlen=1000)
        self.pedestrian_history = deque(maxlen=500)

        logger.info("Traffic Controller initialized")

    # ================= FSM Helper =================

    def change_state(self, new_state):
        prev = self.state
        self.state = new_state
        self.timer = 0
        self.state_change_count += 1
        logger.info(f"STATE: {prev} → {new_state}")

    # ================= Pedestrian =================

    def request_pedestrian(self):
        with self.lock:
            if self.suspended:
                return False, "System suspended"

            if not self.pedestrian_request:
                self.pedestrian_request = True
                self.request_count += 1
                self.stats["total_requests"] += 1
                self.pedestrian_history.append({
                    "timestamp": time.time()
                })
                return True, "Pedestrian request accepted"

            return False, "Request already pending"

    # ================= Tick =================

    def tick(self):
        with self.lock:
            # Auto resume
            if self.suspended:
                if time.time() >= self.suspend_end_time:
                    self.resume()
                else:
                    return

            self.timer += 1

            self.state_history.append({
                "timestamp": time.time(),
                "state": self.state,
                "timer": self.timer
            })

            # ========== FSM ==========
            if self.state == "CAR_GREEN":
                if self.pedestrian_request:
                    if self.timer >= self.MIN_GREEN:
                        self.change_state("CAR_YELLOW")
                    else:
                        self.change_state("PENDING")

            elif self.state == "PENDING":
                if self.timer >= self.MIN_GREEN:
                    self.change_state("CAR_YELLOW")

            elif self.state == "CAR_YELLOW":
                if self.timer >= self.YELLOW_TIME:
                    self.change_state("CAR_RED")

            elif self.state == "CAR_RED":
                if self.timer >= self.WALK_TIME:
                    self.pedestrian_request = False
                    self.change_state("CAR_GREEN")

                    self.cycle_count += 1
                    self.stats["cycles_completed"] += 1

                    cycle_time = self.MIN_GREEN + self.YELLOW_TIME + self.WALK_TIME
                    self.cycle_times.append(cycle_time)
                    if len(self.cycle_times) > 50:
                        self.cycle_times.pop(0)

                    self.stats["avg_cycle_time"] = round(
                        statistics.mean(self.cycle_times), 1
                    )

    # ================= Suspension =================

    def suspend(self, minutes, state="red"):
        with self.lock:
            self.suspended = True
            self.suspend_end_time = time.time() + minutes * 60
            self.suspended_state = state

            if state == "red":
                self.change_state("CAR_RED")
            elif state == "yellow":
                self.change_state("CAR_YELLOW")
            elif state == "green":
                self.change_state("CAR_GREEN")

            logger.info(f"System suspended for {minutes} minutes")

    def resume(self):
        self.suspended = False
        self.suspend_end_time = None
        self.suspended_state = None
        self.change_state("CAR_GREEN")
        logger.info("System resumed")

    # ================= Status =================

    def get_status(self):
        with self.lock:
            self.stats["system_uptime"] = int(time.time() - self.system_start_time)
            return {
                "state": self.state,
                "timer": self.timer,
                "pedestrian": self.pedestrian_request,
                "cycles_completed": self.cycle_count,
                "state_changes": self.state_change_count,
                "avg_cycle_time": self.stats["avg_cycle_time"],
                "system_health": 100 if not self.suspended else 50,
                "suspended": self.suspended
            }

    def reset(self):
        self.__init__()

# =========================
# Controller Instance
# =========================
controller = TrafficController()

# =========================
# Background Thread
# =========================
def scheduler():
    while True:
        time.sleep(1)
        controller.tick()

Thread(target=scheduler, daemon=True).start()

# =========================
# Routes
# =========================
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/state")
def state():
    return jsonify(controller.get_status())

@app.route("/pedestrian", methods=["POST", "GET"])
def pedestrian():
    success, msg = controller.request_pedestrian()
    return jsonify({"success": success, "message": msg})

@app.route("/suspend", methods=["POST"])
def suspend():
    data = request.get_json()
    controller.suspend(data.get("duration", 5), data.get("state", "red"))
    return jsonify({"success": True})

@app.route("/resume", methods=["POST"])
def resume():
    controller.resume()
    return jsonify({"success": True})

@app.route("/reset", methods=["POST"])
def reset():
    controller.reset()
    return jsonify({"success": True})

# =========================
# Run
# =========================
if __name__ == "__main__":
    logger.info("Starting FINAL Enhanced Traffic Control System")
    app.run(debug=True, host="0.0.0.0", port=5000)
