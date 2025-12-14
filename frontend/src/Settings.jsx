/*
Settings menu
Author: Jaroslav Mervart
*/
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import { SettingsModel } from "./models/settingsModel";
import "./styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleClose = () => navigate("/");

  const actions = [
    {
      key: "achievements",
      label: "Reset achievements",
      helper: "Clears all progress and seeds defaults again.",
      run: async () => {
        const res = await SettingsModel.resetAchievements();
        const lockedCount = res?.locked?.length ?? 0;
        const unlockedCount = res?.unlocked?.length ?? 0;
        setFeedback(`Achievements reset. ${lockedCount} locked, ${unlockedCount} unlocked.`);
      },
    },
    {
      key: "pinball-record",
      label: "Reset Pinball record",
      helper: "Sets record to zero but keeps your placed items.",
      run: async () => {
        const res = await SettingsModel.resetPinballRecord();
        setFeedback(`Pinball record reset. Current record: ${res?.record ?? 0}.`);
      },
    },
    {
      key: "breaker-save",
      label: "Clear Brick Breaker save",
      helper: "Deletes the saved run so you can start over.",
      run: async () => {
        await SettingsModel.clearBreakerSave();
        setFeedback("Brick Breaker save cleared.");
      },
    },
  ];

  const handleAction = async (action) => {
    setActiveAction(action.key);
    setFeedback(`Running "${action.label}"...`);
    try {
      await action.run();
    } catch (err) {
      console.error(`Settings action ${action.key} failed:`, err);
      setFeedback(`Failed to ${action.label.toLowerCase()}.`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="page settings-page">
      <Header title="Settings" onClose={handleClose} />
      <div className="settings-body">
        <div className="settings-card">
          <h3>Maintenance</h3>
          <p className="settings-subtitle">Reset progress or clear saves safely.</p>
          <div className="settings-actions">
            {actions.map((action) => (
              <button
                key={action.key}
                className="settings-button"
                onClick={() => handleAction(action)}
                disabled={!!activeAction}
              >
                <span className="settings-button__title">{action.label}</span>
                <span className="settings-button__helper">{action.helper}</span>
              </button>
            ))}
          </div>
          {feedback && <div className="settings-feedback">{feedback}</div>}
        </div>
      </div>
    </div>
  );
}
