use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;
use tokio::time::{interval, Duration};

static POLLING_ACTIVE: AtomicBool = AtomicBool::new(false);

lazy_static::lazy_static! {
    static ref APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
    static ref SUBSCRIPTIONS: Mutex<Vec<Subscription>> = Mutex::new(Vec::new());
    static ref LAST_STATUS: Mutex<std::collections::HashMap<String, TabStatus>> = Mutex::new(std::collections::HashMap::new());
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subscription {
    pub id: String,
    pub subscription_type: String,
    pub dashboard_name: String,
    pub tab_name: Option<String>,
    pub test_name: Option<String>,
}

// Wrapper struct for the actual API response format
#[derive(Debug, Clone, Serialize, Deserialize)]
struct TabSummariesResponse {
    tab_summaries: Vec<TabSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TabSummary {
    tab_name: String,
    overall_status: String,
    #[serde(default)]
    last_run_timestamp: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
enum TabStatus {
    Unknown,
    Passing,
    Failing,
    Flaky,
    Stale,
}

impl From<&str> for TabStatus {
    fn from(status: &str) -> Self {
        match status {
            "PASSING" => TabStatus::Passing,
            "FAILING" => TabStatus::Failing,
            "FLAKY" => TabStatus::Flaky,
            "STALE" => TabStatus::Stale,
            _ => TabStatus::Unknown,
        }
    }
}

pub fn init(app: AppHandle) {
    let mut handle = APP_HANDLE.lock().unwrap();
    *handle = Some(app);
}

pub fn set_subscriptions(subs: Vec<Subscription>) {
    let mut subscriptions = SUBSCRIPTIONS.lock().unwrap();
    *subscriptions = subs;
}

pub fn start_polling(interval_minutes: u64) {
    if POLLING_ACTIVE.load(Ordering::SeqCst) {
        return;
    }

    POLLING_ACTIVE.store(true, Ordering::SeqCst);

    let interval_mins = if interval_minutes < 1 { 1 } else { interval_minutes };

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let mut poll_interval = interval(Duration::from_secs(interval_mins * 60));

            while POLLING_ACTIVE.load(Ordering::SeqCst) {
                poll_interval.tick().await;

                if !POLLING_ACTIVE.load(Ordering::SeqCst) {
                    break;
                }

                check_subscriptions().await;
            }
        });
    });
}

pub fn stop_polling() {
    POLLING_ACTIVE.store(false, Ordering::SeqCst);
}

pub fn is_polling() -> bool {
    POLLING_ACTIVE.load(Ordering::SeqCst)
}

async fn check_subscriptions() {
    let subscriptions = {
        let subs = SUBSCRIPTIONS.lock().unwrap();
        subs.clone()
    };

    if subscriptions.is_empty() {
        return;
    }

    let client = reqwest::Client::new();
    let base_url = "https://testgrid-api.prow.k8s.io/api/v1";

    // Group subscriptions by dashboard
    let mut dashboards: std::collections::HashSet<String> = std::collections::HashSet::new();
    for sub in &subscriptions {
        dashboards.insert(sub.dashboard_name.clone());
    }

    for dashboard in dashboards {
        let url = format!("{}/dashboards/{}/tab-summaries", base_url, dashboard);

        match client.get(&url).send().await {
            Ok(response) => {
                if let Ok(response_data) = response.json::<TabSummariesResponse>().await {
                    for summary in response_data.tab_summaries {
                        let key = format!("{}:{}", dashboard, summary.tab_name);
                        let current_status = TabStatus::from(summary.overall_status.as_str());

                        // Check if this tab is subscribed
                        let is_subscribed = subscriptions.iter().any(|s| {
                            s.dashboard_name == dashboard &&
                            (s.tab_name.is_none() || s.tab_name.as_ref() == Some(&summary.tab_name))
                        });

                        if !is_subscribed {
                            continue;
                        }

                        // Check if status changed to failing
                        let mut last_status = LAST_STATUS.lock().unwrap();
                        let previous = last_status.get(&key).cloned();

                        if current_status == TabStatus::Failing {
                            if previous != Some(TabStatus::Failing) {
                                // Status changed to failing, send notification
                                send_notification(
                                    &format!("Test Failure: {}", summary.tab_name),
                                    &format!("Dashboard '{}' tab '{}' is now failing", dashboard, summary.tab_name),
                                );
                            }
                        }

                        last_status.insert(key, current_status);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to fetch tab summaries for {}: {}", dashboard, e);
            }
        }
    }
}

fn send_notification(title: &str, body: &str) {
    let handle = APP_HANDLE.lock().unwrap();
    if let Some(app) = handle.as_ref() {
        let _ = app.notification()
            .builder()
            .title(title)
            .body(body)
            .show();
    }
}
