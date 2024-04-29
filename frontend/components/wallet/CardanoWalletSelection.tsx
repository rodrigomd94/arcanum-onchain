import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "../ui/button";

export const CARDANO_WALLETS = [
    { name: 'NAMI', icon: '/assets/wallets/nami.svg', url: 'https://namiwallet.io/', displayName: 'Nami', background: 'linear-gradient(45deg, #20c997, #006d75)' },
    { name: 'VESPR', icon: '/assets/wallets/vespr.svg', url: '', displayName: 'Vespr', background: 'linear-gradient(45deg, #2b8dd8, #1c478e)' },
    { name: 'ETERNL', icon: '/assets/wallets/eternl.svg', url: '', displayName: 'Eternl', background: 'linear-gradient(45deg, #a4508b, #5f0a87, #00d2ff)' },
    { name: 'GEROWALLET', icon: '/assets/wallets/gero.svg', url: '', displayName: 'Gero', background: 'linear-gradient(45deg, #38ef7d, #11998e)' },
    { name: 'TYPHONCIP30', icon: '/assets/wallets/typhon.svg', url: '', displayName: 'Typhon', background: 'linear-gradient(45deg, #0000ff, #1e90ff)' },
    { name: 'NUFI', icon: '/assets/wallets/nufi.svg', url: '', displayName: 'NuFi', background: 'linear-gradient(45deg, #a8e063, #56ab2f)' },
    { name: 'BEGIN', icon: '/assets/wallets/begin.svg', url: '', displayName: 'Begin', background: 'linear-gradient(45deg, #007bff, #002f6c)' },
    { name: 'YOROI', icon: '/assets/wallets/yoroi.svg', url: '', displayName: 'Yoroi', background: 'linear-gradient(45deg, #3a7bd5, #27468b)' },
    { name: 'LACE', icon: '/assets/wallets/lace.svg', url: '', displayName: 'Lace', background: 'linear-gradient(45deg, #FFD700, #FF8C00)' },

]

export default function CardanoWalletSelection() {
    const { connectWallet } = useWalletContext();

    return (
        <div className="grid grid-cols-2 gap-2">
            {
                CARDANO_WALLETS.map((wallet, index) => (
                    <Button className={`backdrop-brightness-100 bg-[${wallet.background}]`} key={index} onClick={() => { connectWallet(wallet.name.toLowerCase()) }} variant="outline" >
                        <img src={wallet.icon} alt={wallet.displayName} className="w-6 h-6 mr-2" />
                        {wallet.displayName}
                    </Button>
                ))
            }
        </div>
    )
}