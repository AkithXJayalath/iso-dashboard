import * as React from "react";
import { Modal, DatePicker, Input, Form, Typography, Alert } from "antd";
import * as dayjs from "dayjs";
import { ICalendarEvent, formatDate } from "../utils/eventUtils";

const { TextArea } = Input;
const { Text } = Typography;

interface ICompletionModalProps {
  event: ICalendarEvent | undefined;
  mode: "complete" | "plan";
  saveError?: string;
  onSubmit: (
    event: ICalendarEvent,
    actualDate: Date,
    evidence: string,
  ) => Promise<void>;
  onPlan: (event: ICalendarEvent, plannedDate: Date) => Promise<void>;
  onCancel: () => void;
}

const CompletionModal: React.FC<ICompletionModalProps> = ({
  event,
  mode,
  saveError,
  onSubmit,
  onPlan,
  onCancel,
}) => {
  const [form] = Form.useForm<{
    pickedDate: dayjs.Dayjs | null;
    evidence: string;
  }>();
  const [submitting, setSubmitting] = React.useState(false);
  const [showEvidenceWarn, setShowEvidenceWarn] = React.useState(false);

  React.useEffect(() => {
    if (event) {
      form.resetFields();
      setShowEvidenceWarn(false);
    }
  }, [event, form]);

  const handleOk = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      if (!values.pickedDate) return;

      if (mode === "plan") {
        setSubmitting(true);
        await onPlan(event!, values.pickedDate.toDate());
        return;
      }

      // complete mode — soft evidence warning
      const evidenceTrimmed = (values.evidence ?? "").trim();
      if (!evidenceTrimmed && !showEvidenceWarn) {
        setShowEvidenceWarn(true);
        return;
      }

      setSubmitting(true);
      await onSubmit(event!, values.pickedDate.toDate(), evidenceTrimmed);
    } catch {
      // validateFields rejection — form shows inline errors
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    form.resetFields();
    setShowEvidenceWarn(false);
    onCancel();
  };

  const isPlanMode = mode === "plan";

  const planMonthRange = React.useMemo(() => {
    if (!event || !isPlanMode) return undefined;
    const base = event.plannedDate
      ? dayjs(event.plannedDate)
      : dayjs(`${event.month} 2026`, "MMMM YYYY");
    if (!base.isValid()) return undefined;
    return { start: base.startOf("month"), end: base.endOf("month") };
  }, [event, isPlanMode]);

  return (
    <Modal
      prefixCls="iso-ant-modal"
      open={event !== undefined}
      title={isPlanMode ? "Set Planned Date" : "Mark Event as Completed"}
      okText={
        isPlanMode
          ? "Save Planned Date"
          : showEvidenceWarn
            ? "Confirm without evidence"
            : "Submit"
      }
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      destroyOnClose
      width={480}
    >
      {event && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", fontSize: 14 }}>
              {event.action}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {event.month}
              {!isPlanMode && ` · Planned: ${formatDate(event.plannedDate)}`}
            </Text>
          </div>

          {showEvidenceWarn && (
            <Alert
              type="warning"
              message="No evidence provided. Click 'Confirm without evidence' to proceed anyway, or fill in the evidence field below."
              style={{ marginBottom: 12 }}
            />
          )}

          {saveError && (
            <Alert
              type="error"
              message={saveError}
              style={{ marginBottom: 12 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ pickedDate: null, evidence: "" }}
          >
            <Form.Item
              label={isPlanMode ? "Planned Date" : "Actual Completion Date"}
              name="pickedDate"
              rules={[
                {
                  required: true,
                  message: isPlanMode
                    ? "Please select a planned date."
                    : "Please select the actual completion date.",
                },
              ]}
            >
              <DatePicker
                prefixCls="iso-ant-picker"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={
                  isPlanMode
                    ? (d) =>
                        planMonthRange
                          ? d.isBefore(planMonthRange.start, "day") ||
                            d.isAfter(planMonthRange.end, "day")
                          : false
                    : (d) => d && d.isAfter(dayjs(), "day")
                }
                defaultPickerValue={
                  isPlanMode && planMonthRange
                    ? planMonthRange.start
                    : undefined
                }
                placeholder={
                  isPlanMode ? "Select planned date" : "Select actual date"
                }
              />
            </Form.Item>

            {!isPlanMode && (
              <Form.Item
                label={
                  <span>
                    Evidence / Notes{" "}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      (recommended)
                    </Text>
                  </span>
                }
                name="evidence"
              >
                <TextArea
                  prefixCls="iso-ant-input"
                  rows={3}
                  placeholder="Describe what was done, link to evidence, etc."
                  onChange={() => setShowEvidenceWarn(false)}
                />
              </Form.Item>
            )}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default CompletionModal;
