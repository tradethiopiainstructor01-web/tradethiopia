import { Box, Button, Flex, FormControl, FormLabel, HStack, Select, Text } from '@chakra-ui/react';
import { reportingPeriodOptions, reportingPeriodStart } from '../../utils/tessbinReportingPeriods';

export default function TessbinReportingPeriodPicker({ timeframe, date, disabled, onChange }) {
  const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const currentYear = Number(today.slice(0, 4));
  const year = Number(date.slice(0, 4));
  const minYear = Math.min(currentYear - 5, year - 1);
  const maxYear = Math.max(currentYear + 2, year + 1);
  const options = reportingPeriodOptions(timeframe, year, today);
  const start = reportingPeriodStart(timeframe, date);
  const selected = options.find((option) => option.start === start)?.value || options[0].value;
  const noun = timeframe === 'weekly' ? 'week' : timeframe === 'monthly' ? 'month' : 'quarter';

  return <Box>
    <Text fontWeight="semibold" mb={3}>Which period are you submitting?</Text>
    <HStack mb={4} flexWrap="wrap">
      {['weekly', 'monthly', 'quarterly'].map((value) => <Button key={value} colorScheme="purple"
        variant={timeframe === value ? 'solid' : 'outline'} aria-pressed={timeframe === value}
        textTransform="capitalize" isDisabled={disabled} onClick={() => onChange(value, date)}>{value}</Button>)}
    </HStack>
    <Flex gap={4} align="end" flexWrap="wrap">
      <FormControl maxW="140px">
        <FormLabel htmlFor="kpi-submit-year">Year</FormLabel>
        <Select id="kpi-submit-year" value={year} isDisabled={disabled}
          onChange={(event) => onChange(timeframe, `${event.target.value}-${date.slice(5, 7)}-01`)}>
          {Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </FormControl>
      <FormControl flex="1" minW="220px" maxW="450px">
        <FormLabel htmlFor="kpi-submit-period">Choose {noun}</FormLabel>
        <Select id="kpi-submit-period" value={selected} isDisabled={disabled} onChange={(event) => onChange(timeframe, event.target.value)}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </FormControl>
      <Button variant="outline" colorScheme="purple" isDisabled={disabled} onClick={() => onChange(timeframe, today)}>This {noun}</Button>
    </Flex>
    {timeframe === 'weekly' && <Text fontSize="sm" mt={3}>Each week runs Monday through Sunday. “This week” selects the current week.</Text>}
  </Box>;
}
