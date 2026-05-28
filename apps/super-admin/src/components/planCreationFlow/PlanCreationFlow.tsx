import {
    Container,
    Title,
    Group,
    Text,
    TextInput,
    Switch,
    Button,
    Stack,
    Stepper,
    NumberInput,
    Box,
    Modal,
    Checkbox,
    Alert,
    Divider,
    Paper,
    Select,
    Radio,
    LoadingOverlay,
    ThemeIcon,
  } from '@mantine/core';
  import { IconArrowLeft, IconPlus, IconInfoCircle, IconCircleCheck, IconX } from '@tabler/icons-react';
  import { useState } from 'react';
  
  export function PlanCreationFlow() {
    const [activeStep, setActiveStep] = useState(0);
    const [rulesOpened, setRulesOpened] = useState(false);
    const [creatingOpened, setCreatingOpened] = useState(false);
    const [successOpened, setSuccessOpened] = useState(false);
  
    const nextStep = () => setActiveStep((current) => (current < 2 ? current + 1 : current));
    const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));
  
    const handleCreatePlan = () => {
      setCreatingOpened(true);
      // Simulate plan creation
      setTimeout(() => {
        setCreatingOpened(false);
        setSuccessOpened(true);
      }, 3000);
    };
  
    return (
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Page title */}
          <Title order={3}>Create New Plan</Title>
  
          {/* Back */}
          <Group gap="xs" onClick={prevStep} style={{ cursor: 'pointer' }}>
            <IconArrowLeft size={18} />
            <Text fw={500}>Back</Text>
          </Group>
  
          {/* Stepper */}
          <Stepper
            active={activeStep}
            color="#066F5B"
            size="sm"
            styles={{
              stepLabel: { fontSize: 14 },
            }}
          >
            <Stepper.Step label="Plan Configuration" />
            <Stepper.Step label="User Options" />
            <Stepper.Step label="Plan Visibility & Access" />
          </Stepper>
  
          {/* Step 1: Plan Configuration */}
          {activeStep === 0 && (
            <Box mt="lg">
              <Stack gap="lg">
                <Group grow align="flex-end">
                  <TextInput
                    label="Plan Template Name"
                    placeholder="My First Plan"
                  />
                  <Box>
                    <Text component="label" size="sm" fw={500} mb={4}>
                      Interest Rate
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <NumberInput
                        placeholder="5"
                        min={0}
                        hideControls
                        size="md"
                        styles={{
                          input: {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 0,
                          },
                        }}
                      />
                      <Text
                        style={{
                          border: '1px solid #ced4da',
                          borderLeft: 0,
                          padding: '0 12px',
                          height: 42,
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#f8f9fa',
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                        }}
                      >
                        %
                      </Text>
                    </Group>
                  </Box>
                </Group>
  
                <Group mt="sm">
                  <Switch label="Enable Direct Debit" />
                  <Switch label="Early Withdrawal Allowed" />
                </Group>
  
                {/* Early withdrawal rules */}
                <Stack gap="xs" mt="md">
                  <Text fw={500}>Early Withdrawal Conditions</Text>
                  <Box>
                    <Button
                      variant="outline"
                      leftSection={<IconPlus size={16} />}
                      color="gray"
                      onClick={() => setRulesOpened(true)}
                    >
                      Add Rules
                    </Button>
                  </Box>
                </Stack>
  
                <Group justify="flex-end" mt="xl">
                  <Button color="#066F5B" onClick={nextStep}>
                    Next
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}
  
          {/* Step 2: User Options */}
          {activeStep === 1 && (
            <Box mt="lg">
              <Stack gap="xl">
                <Paper withBorder p="lg" radius="md">
                  <Stack gap="md">
                    {/* Users name their own plan */}
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">Users name their own plan</Text>
                      <Switch />
                    </Group>
  
                    <Divider />
  
                    {/* Users can select frequency */}
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">Users can select frequency</Text>
                      <Switch />
                    </Group>
  
                    <Divider />
  
                    {/* Users can select payment from allowed options */}
                    <Stack gap="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm">Users can select payment from allowed options</Text>
                        <Switch />
                      </Group>
                    
                    </Stack>
  
                    <Divider />
  
                    {/* Start date */}
                    <Stack gap="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm">Start date</Text>
                        <Switch />
                      </Group>
                    </Stack>
  
                    <Divider />
  
                    {/* Users can select duration */}
                    <Stack gap="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm">Users can select duration</Text>
                        <Switch />
                      </Group>
                    </Stack>
  
                    <Divider />
  
                    {/* Users can set their own target amount */}
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">Users can set their own target amount</Text>
                      <Switch />
                    </Group>
                  </Stack>
                </Paper>
  
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" onClick={prevStep}>
                    Back
                  </Button>
                  <Button color="#066F5B" onClick={nextStep}>
                    Next
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}
  
          {/* Step 3: Plan Visibility & Access */}
          {activeStep === 2 && (
            <Box mt="lg">
              <Stack gap="xl">
                <Paper withBorder p="xl" radius="md">
                  <Stack gap="lg">
                    {/* Available to */}
                    <Box>
                      <Text fw={500} size="sm" mb="xs">
                        Available to
                      </Text>
                      <Select
                        placeholder="Select"
                        data={['ROSCA Admin', 'Regular User', 'Both']}
                        size="md"
                      />
                    </Box>
  
                    <Divider />
  
                    {/* Publish Plan */}
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">Publish</Text>
                      <Switch />
                    </Group>
                  </Stack>
                </Paper>
  
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" onClick={prevStep}>
                    Back
                  </Button>
                  <Button color="#066F5B" size="md" onClick={handleCreatePlan}>
                    Create Plan
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}
        </Stack>
  
        {/* Withdrawal Conditions Modal */}
        <Modal
          opened={rulesOpened}
          onClose={() => setRulesOpened(false)}
          title={
            <Text fw={600} size="lg">
              Withdrawal Conditions
            </Text>
          }
          size="lg"
          padding="xl"
        >
          <Stack gap="lg">
            <Text size="sm" c="dimmed">
              Select or enter rules that members must agree to.
            </Text>
  
            <Stack gap="md">
              <Checkbox 
                label="User loses interest if savings is withdrawn before maturity"
                size="sm"
              />
              <Checkbox 
                label="Minimum % of target saved before withdrawal is allowed"
                size="sm"
              />
            </Stack>
  
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="yellow"
              variant="light"
            >
              Custom privilege rules prohibited
            </Alert>
  
            <Divider my="sm" />
  
            <Group justify="space-between" align="center">
              <Button
                variant="outline"
                leftSection={<IconPlus size={16} />}
                color="gray"
              >
                Add Rules
              </Button>
              
              <Group>
                <Button variant="default" onClick={() => setRulesOpened(false)}>Back</Button>
                <Button color="#066F5B" onClick={() => setRulesOpened(false)}>Next</Button>
              </Group>
            </Group>
          </Stack>
        </Modal>
  
        {/* Creating Plan Modal */}
        <Modal
          opened={creatingOpened}
          onClose={() => setCreatingOpened(false)}
          withCloseButton={false}
          closeOnClickOutside={false}
          closeOnEscape={false}
          size="md"
          padding="xl"
        >
          <Stack align="center" gap="lg" py="md">
            <Box pos="relative" style={{ width: 80, height: 80 }}>
              <LoadingOverlay visible={true} loaderProps={{ size: 80 }} />
            </Box>
            
            <Stack gap="xs" align="center">
              <Text fw={600} size="xl">
                Creating plan...
              </Text>
              <Text size="sm" c="dimmed">
                Please wait. Do not close this window.
              </Text>
            </Stack>
          </Stack>
        </Modal>
  
        {/* Success Modal */}
        <Modal
          opened={successOpened}
          onClose={() => setSuccessOpened(false)}
          withCloseButton={false}
          size="md"
          padding="xl"
        >
          <Stack align="center" gap="lg" py="md">
            <ThemeIcon size={80} radius={100} color="#066F5B" variant="light">
              <IconCircleCheck size={48} />
            </ThemeIcon>
            
            <Stack gap="xs" align="center">
              <Text fw={600} size="xl">
                Your plan created successfully.
              </Text>
            </Stack>
  
            <Button 
              fullWidth 
              color="#066F5B" 
              size="md" 
              mt="md"
              onClick={() => {
                setSuccessOpened(false);
                setActiveStep(0); // Reset to first step
              }}
            >
              Done
            </Button>
          </Stack>
        </Modal>
      </Container>
    );
  }