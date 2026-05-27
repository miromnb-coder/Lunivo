import { Edit3, Flag, GraduationCap, Globe2, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { CURRENT_CREDITS } from './meSheetData';
import { MeSheetCard, MeSheetDivider } from './MeSheetCard';
import { MeSheetRow } from './MeSheetRow';
import { styles } from './meSheetStyles';

type MeSheetProfileViewProps = {
  displayName: string;
  initials: string;
  onOpenCredits: () => void;
};

export function MeSheetProfileView({ displayName, initials, onOpenCredits }: MeSheetProfileViewProps) {
  return (
    <>
      <View style={styles.headerArea}>
        <View style={styles.avatar}>
          <Text allowFontScaling={false} style={styles.avatarText}>
            {initials}
          </Text>
        </View>
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          minimumFontScale={0.78}
          numberOfLines={1}
          style={styles.name}
        >
          {displayName}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Your study profile
        </Text>
      </View>

      <MeSheetCard>
        <MeSheetRow Icon={Target} label="Focus" value="Biology, Writing, Planning" />
        <MeSheetDivider />
        <MeSheetRow Icon={Globe2} label="Language" value="Finnish / English" />
        <MeSheetDivider />
        <MeSheetRow Icon={Sparkles} label="Style" value="Calm and clear" />
        <MeSheetDivider />
        <MeSheetRow Icon={Star} label="Credits" value={`${CURRENT_CREDITS}`} onPress={onOpenCredits} />
        <MeSheetDivider />
        <MeSheetRow Icon={Flag} label="Goals" value="Stay consistent, learn faster" />
      </MeSheetCard>

      <Text allowFontScaling={false} style={styles.sectionLabel}>
        QUICK ACTIONS
      </Text>

      <MeSheetCard>
        <MeSheetRow Icon={Edit3} label="Edit profile" />
        <MeSheetDivider />
        <MeSheetRow Icon={SlidersHorizontal} label="Preferences" />
        <MeSheetDivider />
        <MeSheetRow Icon={GraduationCap} label="Study settings" />
      </MeSheetCard>
    </>
  );
}
